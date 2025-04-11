import express from 'express';
import { getQuestions, submitAnswer, getSubmissions } from '../controllers/training';
import auth from '../middleware/authentication';

const router = express.Router();

router.get('/:topic/:type', auth, getQuestions);
router.post('/:topic/:type/submit', auth, submitAnswer);
router.get('/:topic/:type/submissions', auth, getSubmissions);

export default router;
