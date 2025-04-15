import express, {NextFunction} from "express";
import { getQuestions, submitAnswer, getSubmissions, createQuestion, updateQuestion, deleteQuestion, getAllQuestions } from "../controllers/training";
import auth, {adminOnly} from "../middleware/authentication";

const router = express.Router();



router.get('/:topic/:type', auth, getQuestions);
router.post('/:topic/:type/submit', auth, submitAnswer);
router.get('/:topic/:type/submissions', auth, getSubmissions);
router.post('/questions', auth, adminOnly, createQuestion); // Create a new question
router.patch('/questions/:id', auth, adminOnly, updateQuestion); // Update an existing question
router.delete('/questions/:id', auth, adminOnly, deleteQuestion);
router.get('/questions', auth, adminOnly, getAllQuestions);

export default router;
