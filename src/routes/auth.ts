import express from "express";
import { login, registerUser } from "../controllers/auth";

const router = express.Router();

// Register a new user
router.post("/register/user", registerUser);

// Login user or provider
router.post("/login", login);

//Get current user details
router.get("/me");

//logout
router.post("/logout");

export default router;
