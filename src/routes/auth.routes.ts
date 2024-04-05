import { Router } from "express";
import { createUser, loginUser } from "../controllers/auth.controller";

const route = Router();

route.post("/create-user", createUser);
route.post("/login", loginUser);

export default route;
