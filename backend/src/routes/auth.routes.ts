import { Router, Request, Response } from 'express';
import authService from '../controllers/auth.controller';
import { JwtPayload } from 'jsonwebtoken';

const router = Router();

router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ 
                success: false,
                message: 'No refresh token provided' 
            });
        }

        const decoded = authService.verifyRefreshToken(refreshToken);
        
        if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired refresh token' 
            });
        }

        const newAccessToken = authService.generateAccessToken({ id: (decoded as any).id });
        
        return res.status(200).json({ 
            success: true,
            accessToken: newAccessToken,
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