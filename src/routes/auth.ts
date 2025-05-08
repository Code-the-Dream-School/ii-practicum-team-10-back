import express from "express";
import { login, registerUser, forgotPassword, resetPassword, googleLogin, googleCallback, googleSignIn } from "../controllers/auth";

const router = express.Router();

// Register a new user
router.post("/register/user", registerUser);

// Login user or provider
router.post("/login", login);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Google authentication (redirect-based)
router.get('/google', googleLogin); // Initiates Google login
router.get('/google/callback', googleCallback); // Handles callback

// Google Sign-In with ID token
router.post('/google/signin', googleSignIn); // Handles ID token from frontend

export default router;
