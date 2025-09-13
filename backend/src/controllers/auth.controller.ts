import jwt, { JwtPayload } from "jsonwebtoken";
import 'dotenv/config';

const ACCESS_TOKEN_SECRET = process.env.SECRET_KEY as string;
const REFRESH_TOKEN_SECRET = process.env.SECRET_KEY as string; 

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error("Missing JWT secret key in environment variables");
}

const authService = {
    generateAccessToken(user: { id: string }) {
        if (!user || !user.id) {
            throw new Error('User ID is required to generate access token');
        }
        return jwt.sign({ id: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    },

    generateRefreshToken(user: { id: string }) {
        if (!user || !user.id) {
            throw new Error('User ID is required to generate refresh token');
        }
        return jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    },

    verifyAccessToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
        } catch (error) {
            return null;
        }
    },

    verifyRefreshToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
        } catch (error) {
            console.error('Refresh token verification failed:', error);
            return null;
        }
    },

    setTokens(res: any, userId: string) {
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

export default authService;