import { Router } from "express";
import { getSeatAvailability } from "../controllers/booking.controller";

const route = Router();

route.get("/get-seat-availability", getSeatAvailability);

export default route;
