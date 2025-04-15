import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors';
import { StatusCodes } from "http-status-codes";
import User from '../models/User'; // Import User model for adminOnly

export interface AuthenticatedRequest extends Request {
    user?: { userId: string; name: string; role?: string };
}

const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthenticatedError("Authentication invalid");
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            name: string;
            role?: string;
        };

        req.user = { userId: payload.userId, name: payload.name, role: payload.role };
        next();
    } catch (err) {
        throw new UnauthenticatedError("Authentication invalid");
    }
};

export const adminOnly = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: "Admin access required" });
    }
    next();
};

export default auth;
