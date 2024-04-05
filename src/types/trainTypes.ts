import { object, string, number, array } from "zod";

export const TrainSchema = object({
  trainName: string(),
  trainNo: string(), 
  totalSeats: number(),
  routes: array(
    object({
      stationCode: string(),
      arrival: string(), 
      departure: string(),
    })
  ),
});

export interface route {
  stationCode: string;
  arrival: string;
  departure: string;
}
