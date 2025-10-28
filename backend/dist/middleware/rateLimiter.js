"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upstash_1 = __importDefault(require("../config/upstash"));
const rateLimiter = async (req, res, next) => {
    try {
        //is should be the ip address or the userId of the user which is unique
        const { success } = await upstash_1.default.limit("my-rate-limit");
        if (!success) {
            return res
                .status(429)
                .send({ msg: "Too many request, please try again later" });
        }
        next();
    }
    catch (error) {
        console.log("Rate Limiting Error");
        next(error);
    }
};
exports.default = rateLimiter;
