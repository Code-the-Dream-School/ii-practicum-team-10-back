import express from "express";
import { login, registerUser, forgotPassword, resetPassword, googleLogin, googleCallback } from "../controllers/auth";

const router = express.Router();

// Register a new user
router.post("/register/user", registerUser);

// Login user or provider
router.post("/login", login);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

//google authentication
router.get('/google', googleLogin); // Initiates Google login
router.get('/google/callback', googleCallback); // Handles callback

export default router;
