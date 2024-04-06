import { Request, Response } from "express";
import {
  GetBookingByIdParamsSchema,
  GetSeatsQuerySchema,
} from "../types/bookingTypes";
import { ZodError } from "zod";
import db from "../config/db";
import { produceBooking } from "../services/kafka";
import { CustomRequest } from "../types/generalTypes";

export const getSeatAvailability = async (req: Request, res: Response) => {
  try {
    const { source, destination } = GetSeatsQuerySchema.parse(req.query);

    const availableTrainsResult = await db.query(
      `SELECT DISTINCT
      t1.train_no,
      t1.arrival AS source_arrival,
      t2.departure AS destination_departure
    FROM timetable AS t1
    CROSS JOIN timetable AS t2
    WHERE t1.station_code = $1
      AND t2.station_code = $2
      AND t1.train_no = t2.train_no
      AND t1.arrival < t2.arrival;`,
      [source, destination]
    );

    const availableTrains = availableTrainsResult.rows;

    const trainsWithSeats = await Promise.all(
      availableTrains.map(async (train: any) => {
        const { train_no, source_arrival, destination_departure } = train;
        const seatsAvailableResult = await db.query(
          `SELECT MIN(seats_available) AS min_seats_available
        FROM timetable
        WHERE train_no = $1
          AND arrival >= $2
          AND departure <= $3;`,
          [train_no, source_arrival, destination_departure]
        );

        //@ts-ignore
        const minSeatsAvailable =
          seatsAvailableResult.rows[0]?.min_seats_available;
        return {
          train_no,
          source_arrival,
          destination_departure,
          minSeatsAvailable,
        };
      })
    );

    return res.status(200).json({ data: trainsWithSeats });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const bookSeat = async (req: CustomRequest, res: Response) => {
  try {
    const booking = await produceBooking({
      ...req.body,
      userId: req.userId,
    });

    res.status(200).json({ data: booking });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookingDetailsById = async (req: Request, res: Response) => {
  try {
    const { bookingId } = GetBookingByIdParamsSchema.parse(req.params);

    const booking = await db.query(
      "SELECT * FROM bookings where booking_id = $1",
      [bookingId]
    );

    return res.send(200).json(booking);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const bookingHandler = async (bookingData: any) => {
  try {
    const { train_no, source, destination, seats, userId } = bookingData;

    const routeResult: any = await db.query(
      `SELECT *
      FROM timetable
      WHERE train_no = $1
        AND arrival BETWEEN (
          SELECT arrival
          FROM timetable
          WHERE train_no = $1 AND station_code = $2
        ) AND (
          SELECT arrival
          FROM timetable
          WHERE train_no = $1 AND station_code = $3
        );
      `,
      [train_no, source, destination]
    );

    const minAvailableSeats = Math.min(
      routeResult.rows.map(
        (station: { seats_available: number }) => station.seats_available
      )
    );

    if (minAvailableSeats < seats) {
      throw new Error("Not enough seats");
    }

    for (const station of routeResult.rows) {
      const updatedSeats = station.seats_available - seats;

      await db.query(
        "UPDATE timetable SET seats_available = $1 WHERE train_no = $2 AND station_code = $3",
        [updatedSeats, train_no, station.station_code]
      );
    }

    const booking = await db.query(
      "INSERT INTO bookings (userid, train_no, source_station, destination_station, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, train_no, source, destination, "CONFIRMED"]
    );
    
    return booking.rows;
  } catch (error) {
    console.error("Error in bookingHandler:", error);

    throw error;
  }
};
