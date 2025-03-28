import express from "express";
import { mainController } from "../controllers/mainController"; // ✅ Ensure correct import

const router = express.Router();

router.get("/", mainController); // ✅ Pass function directly

export default router;
