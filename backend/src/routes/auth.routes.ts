import { Router, Request, Response } from 'express';
import authService from '../controllers/auth.controller';
import { JwtPayload } from 'jsonwebtoken';

const router = Router();

// Refresh access token using refresh token
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        // Get refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ 
                success: false,
                message: 'No refresh token provided' 
            });
        }

        // Verify the refresh token
        const decoded = authService.verifyRefreshToken(refreshToken);
        
        if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired refresh token' 
            });
        }

        // Generate new access token
        const newAccessToken = authService.generateAccessToken({ id: (decoded as any).id });
        
        // Optionally, you can also refresh the refresh token here
        // const newRefreshToken = authService.generateRefreshToken({ id: (decoded as any).id });
        
        return res.status(200).json({ 
            success: true,
            accessToken: newAccessToken,
            // refreshToken: newRefreshToken // Uncomment if refreshing refresh token
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error during token refresh' 
        });
    }
});

// Logout - Clear tokens
router.post('/logout', (req: Request, res: Response) => {
    // Clear the refresh token cookie
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

export default router;