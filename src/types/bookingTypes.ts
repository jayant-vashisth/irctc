import { object, string } from "zod";

export const GetSeatsQuerySchema = object({
  source: string(),
  destination: string(),
});

export const GetBookingByIdParamsSchema = object({
  bookingId: string(),
});
