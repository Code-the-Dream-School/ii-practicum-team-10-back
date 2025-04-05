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
/**
 * @swagger
 * /api/v1/auth/register/user:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alex
 *               email:
 *                 type: string
 *                 example: alex@gmail.com
 *               password:
 *                 type: string
 *                 example: secret
 *               verifyPassword:
 *                 type: string
 *                 example: secret
 *             required:
 *               - name
 *               - email
 *               - password
 *               - verifyPassword
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., missing fields, passwords don't match, email in use)
 */
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
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture // Include the assigned profile picture
        },
        token
    });
};
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: salex@gmail.com
 *               password:
 *                 type: string
 *                 example: secret
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 */
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

    const token = jwt.sign(
        { userId: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "30d" }
    );

    res.status(StatusCodes.OK).json({
        user: {
            userId: user._id,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture
        },
        token,
    });
};
