import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../interfaces/permission.interface";

declare global {
  namespace Express {
    export interface Request {
      user?: IUser
    }
  }
}

export {};
