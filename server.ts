import express, { Request, Response } from "express";
import dotenv from "dotenv";
import trainRoutes from "./src/routes/train.routes";
import bookingRoutes from "./src/routes/booking.routes";
import authRoutes from "./src/routes/auth.routes";
import { startBookingConsumer } from "./src/services/kafka";

dotenv.config();

const app = express();
const PORT = 5000; //process
console.log("url", process.env.KAFKA_URL);
app.get("/", (req: Request, res: Response) => {
  res.send("hello world");
});

app.use(express.json());

app.use("/api", trainRoutes);
app.use("/api", bookingRoutes);
app.use("/api", authRoutes);

startBookingConsumer();

app.listen(PORT, () => {
  console.log("app listening");
});
