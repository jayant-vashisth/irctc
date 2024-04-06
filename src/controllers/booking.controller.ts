import { Request, Response } from "express";
import { GetSeatsQuerySchema } from "../types/bookingTypes";
import { ZodError } from "zod";
import db from "../config/db";

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
        const minSeatsAvailable = seatsAvailableResult.rows[0]?.min_seats_available;
        return {
          train_no,
          source_arrival,
          destination_departure,
          minSeatsAvailable,
        };
      })
    );

    res.status(200).json({ data: trainsWithSeats });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const bookSeat = async (req: Request, res: Response) => {
  try {
    const { train_no, source, destination, seats } = req.body;

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

    let minAvailableSeats = Infinity;
    for (const station of routeResult.rows) {
      if (station.seats_available < minAvailableSeats) {
        minAvailableSeats = station.seats_available;
      }
    }

    if (minAvailableSeats < seats) {
      return res
        .status(400)
        .json({ success: false, error: "Not enough available seats" });
    }

    for (const station of routeResult.rows) {
      const updatedSeats = station.seats_available - seats;

      await db.query(
        "UPDATE timetable SET seats_available = $1 WHERE train_no = $2 AND station_code = $3",
        [updatedSeats, train_no, station.station_code]
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
