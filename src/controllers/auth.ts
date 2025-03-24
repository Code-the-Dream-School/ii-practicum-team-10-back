import { Request, Response } from "express";
import User from "../models/User";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    body: {
        name?: string;
        email: string;
        password: string;
        verifyPassword: string;
    };
}


// **User Registration**
export const registerUser = async (req: AuthRequest, res: Response) => {
    const { name, email, password, verifyPassword } = req.body;

    if (!name || !email || !password || !verifyPassword) {
        throw new BadRequestError("All fields are required.");
    }
    if (password !== verifyPassword) {
        throw new BadRequestError("Passwords do not match.");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new BadRequestError("Email is already in use.");
    }

    const user = await User.create({ name, email, password, role: "user" });
    const token = user.createJWT();

    res.status(StatusCodes.CREATED).json({
        user: { name: user.name, email: user.email, role: user.role },
        token
    });
};

// **Login for User
export const login = async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError("Please provide an email and password.");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new UnauthenticatedError("Invalid credentials.");
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid credentials.");
    }

    const isProvider = user.role === "provider";
    const token = jwt.sign(
        { userId: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
    );

    res.status(StatusCodes.OK).json({
        user: {
            email: user.email,
            role: user.role,
            providerId: isProvider ? user._id : null,
        },
        token,
    });
};
