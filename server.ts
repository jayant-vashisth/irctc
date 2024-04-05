import express, { Request, Response } from "express";
import dotenv from "dotenv";
import trainRoutes from "./src/routes/train.routes";
// import db from "./src/config/db";

dotenv.config();

const app = express();
const PORT = 5000; //process

app.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});

app.use(express.json());
app.use("/api", trainRoutes);

app.listen(PORT, () => {
  console.log("app listening");
});
