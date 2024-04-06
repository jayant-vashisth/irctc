import { Router } from "express";
import {
  bookSeat,
  getSeatAvailability,
} from "../controllers/booking.controller";

const route = Router();

route.get("/get-seat-availability", getSeatAvailability);
route.get("/book-seat", bookSeat);

export default route;
