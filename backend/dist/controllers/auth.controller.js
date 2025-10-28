"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const ACCESS_TOKEN_SECRET = process.env.SECRET_KEY;
const REFRESH_TOKEN_SECRET = process.env.SECRET_KEY;
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error("Missing JWT secret key in environment variables");
}
const authService = {
    generateAccessToken(user) {
        if (!user || !user.id) {
            throw new Error('User ID is required to generate access token');
        }
        return jsonwebtoken_1.default.sign({ id: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    },
    generateRefreshToken(user) {
        if (!user || !user.id) {
            throw new Error('User ID is required to generate refresh token');
        }
        return jsonwebtoken_1.default.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    },
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
        }
        catch (error) {
            return null;
        }
    },
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
        }
        catch (error) {
            console.error('Refresh token verification failed:', error);
            return null;
        }
    },
    setTokens(res, userId) {
        const accessToken = this.generateAccessToken({ id: userId });
        const refreshToken = this.generateRefreshToken({ id: userId });
        // Set HTTP-only cookie for refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return { accessToken, refreshToken };
    }
};
exports.default = authService;
