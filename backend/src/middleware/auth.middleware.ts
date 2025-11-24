import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

  if (!token) {
    console.log("Token is not present in the request");
    res.status(401).json({ 
      message: "No token provided. Please log in.",
      code: "NO_TOKEN"
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY!);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ err: "Invalid token" });
  }
};
