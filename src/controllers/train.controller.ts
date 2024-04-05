import { Request, Response } from "express";
import { ZodError } from "zod";
import db from "../config/db";
import { TrainSchema, route } from "../types/trainTypes";

export const addNewTrain = async (req: Request, res: Response) => {
  console.log(req.body);
  try {
    const { trainName, trainNo, totalSeats, routes } = TrainSchema.parse(
      req.body
    );

    // console.log(trainName, trainNo, totalSeats);

    const train = await db.query(
      "INSERT INTO trains (train_name, train_no, total_seats) VALUES ($1, $2, $3) RETURNING *",
      [trainName, trainNo, totalSeats]
    );
    // console.log("train", train);

    const timeTablePromise = routes.map(async (route: route) => {
      const { stationCode, arrival, departure } = route;
      await db.query(
        "INSERT INTO timetable (train_no, station_code, arrival, departure, seats_available, total_seats) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [trainNo, stationCode, arrival, departure, totalSeats, totalSeats]
      );

      console.log("station added to route");
    });

    await Promise.all(timeTablePromise);

    return res.status(201).json({
      success: true,
      data: train.rows,
      routes: routes,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

// note:
// each train no. should be of 6 digits only
