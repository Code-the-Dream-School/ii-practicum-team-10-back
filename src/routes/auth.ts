import express from "express";
import { login, registerUser, forgotPassword, resetPassword } from "../controllers/auth";

const router = express.Router();

// Register a new user
router.post("/register/user", registerUser);

// Login user or provider
router.post("/login", login);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

export default router;
