"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }
        const decoded = auth_controller_1.default.verifyRefreshToken(refreshToken);
        if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
        const newAccessToken = auth_controller_1.default.generateAccessToken({ id: decoded.id });
        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during token refresh'
        });
    }
});
// Logout - Clear tokens
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    return res.status(200).json({
        success: true,
        message: 'Successfully logged out'
    });
});
exports.default = router;
