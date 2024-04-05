import { Request, Response } from "express";
import { AuthSchema, LoginSchema } from "../types/authTypes";
import bcrypt from "bcrypt";
import db from "../config/db";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { generateApiKey } from "../helper/generateAPIKey";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, isAdmin } = AuthSchema.parse(
      req.body
    );

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT) || 10
    ); //dont hardcode salt

    let apiKey: string | null = null;

    if (isAdmin) {
      apiKey = await generateApiKey();
    }

    const result: any = await db.query(
      "INSERT INTO users (first_name, last_name, email, password, isAdmin, API_key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [firstName, lastName, email, hashedPassword, isAdmin, apiKey]
    );

    const token = jwt.sign(
      { userId: result.rows[0].userid },
      process.env.JWT_SECRET || "your_secret_key",
      {
        expiresIn: "1h",
      }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { ...result.rows[0], token },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user: any = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const hashedPassword = user.rows[0].password;
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user.rows[0].userid },
      process.env.JWT_SECRET || "your_secret_key",
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { userId: user.rows[0].userid, token },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};
