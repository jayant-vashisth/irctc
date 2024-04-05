import { Router } from "express";
import { addNewTrain } from "../controllers/train.controller";

const route = Router();

route.post("/add-train", addNewTrain);

export default route;
