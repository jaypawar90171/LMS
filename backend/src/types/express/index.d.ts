import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    // Extend the Request interface
    export interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      }
    }
  }
}

export {};
