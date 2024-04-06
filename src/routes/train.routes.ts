import { Router } from "express";
import { addNewTrain } from "../controllers/train.controller";
import { adminAuthMiddleware } from "../middleware/auth.middleware";

const route = Router();

route.post("/add-train", adminAuthMiddleware, addNewTrain);

export default route;
