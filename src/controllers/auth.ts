import { Request, Response } from "express";
import User from "../models/User";
import PasswordResetToken from '../models/PasswordResetToken';
import { OAuth2Client } from 'google-auth-library';
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';

const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
});


interface AuthRequest extends Request {
    body: {
        name?: string;
        email: string;
        password: string;
        verifyPassword: string;
    };
}

// Initiate Google login
export const googleLogin = async (req: Request, res: Response) => {
    const authUrl = client.generateAuthUrl({
        scope: ['profile', 'email', 'openid'],
        prompt: 'consent',
    });
    console.log('GoogleLogin - Redirect URL:', authUrl);
    res.redirect(authUrl);
};

// Handle Google callback
export const googleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    if (!code) {
        throw new BadRequestError('No authorization code provided');
    }

    try {
        // Exchange code for tokens
        const { tokens } = await client.getToken(code as string);
        console.log('GoogleCallback - Tokens received');

        // Verify ID token and get user info
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new UnauthenticatedError('Invalid Google token');
        }

        const { sub: googleId, email, name } = payload;
        console.log('GoogleCallback - User:', { googleId, email, name });

        // Check if user exists
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            // Register new user
            user = await User.create({
                email,
                googleId,
                name,
            });
            console.log('GoogleCallback - New user created:', user._id);
        } else if (!user.googleId) {
            // Link Google ID to existing user
            user.googleId = googleId;
            await user.save();
            console.log('GoogleCallback - Linked Google ID to user:', user._id);
        } else {
            console.log('GoogleCallback - Existing user logged in:', user._id);
        }

        // Generate JWT (adjust as per your auth system)
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        // Redirect to frontend with token
        const frontendUrl = `${process.env.BASE_URL_FRONT}/auth/success?token=${token}`;
        res.redirect(frontendUrl);
    } catch (error) {
        console.error('GoogleCallback - Error:', error);
        res.redirect(`${process.env.BASE_URL_FRONT}/auth/error`);
    }
};
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
            name: user.name,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture
        },
        token,
    });
};
/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
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
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Password reset email sent. Please check your inbox.
 *       400:
 *         description: Please provide an email
 *       404:
 *         description: No user found with this email
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        throw new BadRequestError('Please provide an email.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError('No user found with this email.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log('ForgotPassword - Plain token:', resetToken);
    console.log('ForgotPassword - Hashed token:', hashedToken);
    console.log('ForgotPassword - User ID:', user._id);

    await PasswordResetToken.create({
        userId: user._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    console.log('ForgotPassword - Token saved for user:', user._id);

    const resetUrl = `${process.env.BASE_URL_FRONT}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
    console.log('ForgotPassword - Reset URL:', resetUrl);

    const emailContent = `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
    `;

    try {
        await sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html: emailContent,
        });
        console.log('ForgotPassword - Email sent to:', email);
        res.status(StatusCodes.OK).json({ msg: 'Password reset email sent. Please check your inbox.' });
    } catch (error) {
        console.error('ForgotPassword - Email sending failed:', error);
        await PasswordResetToken.deleteOne({ userId: user._id, token: hashedToken });
        throw new BadRequestError('Failed to send reset email. Please try again.');
    }
};

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset user password
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
 *               token:
 *                 type: string
 *                 example: <reset-token>
 *               password:
 *                 type: string
 *                 example: newSecret123
 *               verifyPassword:
 *                 type: string
 *                 example: newSecret123
 *             required:
 *               - email
 *               - token
 *               - password
 *               - verifyPassword
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Password reset successfully.
 *       400:
 *         description: Invalid request (e.g., missing fields, passwords don't match)
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: No user found with this email
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { email, token, password, verifyPassword } = req.body;

    if (!email || !token || !password || !verifyPassword) {
        throw new BadRequestError('Please provide email, token, password, and verifyPassword.');
    }

    if (password !== verifyPassword) {
        throw new BadRequestError('Passwords do not match.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError('No user found with this email.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('ResetPassword - Request token:', token);
    console.log('ResetPassword - Hashed request token:', hashedToken);
    console.log('ResetPassword - User ID:', user._id);

    const resetToken = await PasswordResetToken.findOne({
        userId: user._id,
        token: hashedToken,
        expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
        console.log('ResetPassword - No valid token found for user:', user._id);
        console.log('ResetPassword - Current time:', new Date());
        throw new UnauthenticatedError('Invalid or expired reset token.');
    }
    console.log('ResetPassword - Found token, expiresAt:', resetToken.expiresAt);

    user.password = password;
    await user.save();

    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    console.log('ResetPassword - Token deleted, password updated for user:', user._id);

    res.status(StatusCodes.OK).json({ msg: 'Password reset successfully.' });
};
