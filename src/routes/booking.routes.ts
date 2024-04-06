import { Router } from "express";
import {
  bookSeat,
  getSeatAvailability,
} from "../controllers/booking.controller";
import { userAuthMiddleware } from "../middleware/auth.middleware";

const route = Router();

route.get("/get-seat-availability", userAuthMiddleware, getSeatAvailability);
route.post("/book-seat", userAuthMiddleware, bookSeat);
route.get("/get-booking-details", userAuthMiddleware, bookSeat);

export default route;
