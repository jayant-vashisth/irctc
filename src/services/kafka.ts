import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import { bookingHandler } from "../controllers/booking.controller";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  brokers: [process.env.KAFKA_URL || "PLAINTEXT://localhost:9092"],
  ssl: {
    ca: [fs.readFileSync("./ca.pem", "utf-8")],
  },
  sasl: {
    username: process.env.KAFKA_USERNAME || "",
    password: process.env.KAFKA_PASSWORD || "",
    mechanism: "plain",
  },
});

let producer: Producer | null = null;

export async function createProducer() {
  if (producer) return producer;
  const _producer = kafka.producer();
  await _producer.connect();

  producer = _producer;

  return producer;
}

export async function produceBooking(booking: object) {
  const producer = await createProducer();
  await producer.send({
    topic: "BOOKING_REQUEST",
    messages: [{ value: JSON.stringify(booking) }],
  });
}

export async function startBookingConsumer() {
  const consumer = kafka.consumer({ groupId: "BOOKING_REQUEST" });
  await consumer.connect();
  await consumer.subscribe({ topic: "BOOKING_REQUEST", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message, pause }) => {
      console.log("New message received");

      if (!message.value) return;

      try {
        
        await bookingHandler(message.value.toString());

        console.log("booking created")
      } catch (err) {
        console.error("Error processing message:", err);
        console.log("something is wrong");
        pause();
        setTimeout(() => {
          consumer.resume([{ topic: "BOOKING_REQUEST" }]);
        }, 60 * 1000);
      }
    },
  });
}
