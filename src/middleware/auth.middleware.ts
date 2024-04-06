import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../config/db";
import { CustomRequest } from "../types/generalTypes";


export const adminAuthMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers.apikey;
  const isAdmin = req.body.isAdmin;

  try {
    if (isAdmin && apiKey) {
      const admin = await db.query(
        "SELECT * FROM users WHERE isAdmin = true AND API_key = $1",
        [apiKey]
      );
      if (!admin.rows.length) {
        return res
          .status(401)
          .json({ error: "Unauthorized - Invalid API key" });
      }
      next();
    } else {
      return res.status(401).json({
        error: "Unauthorized - Admin authentication failed",
      });
    }
  } catch (error) {
    console.error("Error in admin authentication middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const userAuthMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authToken = req.headers.authorization;

  try {
    if (authToken) {
      const token = authToken.split(" ")[1];
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET || ""
      ) as JwtPayload;

      req.userId = decodedToken.userId;
      next();
    } else {
      return res.status(401).json({
        error: "Unauthorized - Authentication token is missing",
      });
    }
  } catch (error) {
    console.error("Error in user authentication middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
