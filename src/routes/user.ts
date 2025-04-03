import express from "express";
import { getUserProgress, updateUserProgress } from "../controllers/user";
import auth from "../middleware/authentication";

const router = express.Router();

router.get("/:id/progress", auth, getUserProgress); // Fetch user's training progress
router.post("/:id/progress", auth, updateUserProgress); // Update progress for a user

export default router;
