"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const authUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
    if (!token) {
        res.status(401).send({ err: "Token in not present in the request" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        if (typeof decoded === 'string') {
            console.log("Token is a string:", decoded);
            // Handle string case if needed
        }
        else {
            console.log("Token is JwtPayload:", decoded);
            console.log("User ID:", decoded.id); // TypeScript now knows it's JwtPayload
            console.log("Email:", decoded.email);
            console.log("Issued at:", decoded.iat);
            console.log("Expires at:", decoded.exp);
        }
        req.user = decoded;
        console.log(req.user);
        next();
    }
    catch (error) {
        console.log(error);
        res.status(401).json({ err: "Invalid token" });
    }
};
exports.authUser = authUser;
