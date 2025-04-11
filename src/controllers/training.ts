import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Question from '../models/Question';
import UserSubmission from '../models/UserSubmission';
import { AuthenticatedRequest } from '../middleware/authentication';
import { BadRequestError, NotFoundError } from '../errors';

/**
 * @swagger
 * /api/v1/training/{topic}/{type}:
 *   get:
 *     summary: Get questions for a specific topic and training type
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CSS, HTML, JavaScript, React, NodeJS]
 *         description: The topic of the questions
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [flashcard, quiz, codingChallenge]
 *         description: The type of training
 *     responses:
 *       200:
 *         description: List of questions the user hasn't submitted yet
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   topic:
 *                     type: string
 *                   type:
 *                     type: string
 *                   codeSnippet:
 *                     type: string
 *                   questionText:
 *                     type: string
 *                   answers:
 *                     type: array
 *                     items:
 *                       type: string
 *                   status:
 *                     type: string
 *       400:
 *         description: Invalid topic or type
 *       401:
 *         description: Authentication invalid
 */
export const getQuestions = async (req: AuthenticatedRequest, res: Response) => {
    const { topic, type } = req.params;
    const userId = req.user?.userId;

    const validTopics = ['CSS', 'HTML', 'JavaScript', 'React', 'NodeJS'];
    const validTypes = ['flashcard', 'quiz', 'codingChallenge'];

    if (!validTopics.includes(topic)) {
        throw new BadRequestError('Invalid topic');
    }
    if (!validTypes.includes(type)) {
        throw new BadRequestError('Invalid type');
    }

    const submittedQuestions = await UserSubmission.find({ userId, topic, type, status: 'done' });
    const submittedQuestionIds = submittedQuestions.map((submission) => submission.questionId);

    const questions = await Question.find({
        topic,
        type,
        _id: { $nin: submittedQuestionIds },
    });

    const formattedQuestions = questions.map((question) => ({
        id: question._id,
        topic: question.topic,
        type: question.type,
        codeSnippet: question.codeSnippet,
        questionText: question.questionText,
        answers: question.answers,
        status: 'not done',
    }));

    res.status(StatusCodes.OK).json(formattedQuestions);
};
/**
 * @swagger
 * /api/v1/training/{topic}/{type}/submit:
 *   post:
 *     summary: Submit an answer for a question
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CSS, HTML, JavaScript, React, NodeJS]
 *         description: The topic of the question
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [flashcard, quiz, codingChallenge]
 *         description: The type of training
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: The ID of the question being submitted
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *       400:
 *         description: Invalid topic, type, or missing questionId
 *       401:
 *         description: Authentication invalid
 */
export const submitAnswer = async (req: AuthenticatedRequest, res: Response) => {
    const { topic, type } = req.params;
    const { questionId } = req.body;
    const userId = req.user?.userId;

    const validTopics = ['CSS', 'HTML', 'JavaScript', 'React', 'NodeJS'];
    const validTypes = ['flashcard', 'quiz', 'codingChallenge'];

    if (!validTopics.includes(topic)) {
        throw new BadRequestError('Invalid topic');
    }
    if (!validTypes.includes(type)) {
        throw new BadRequestError('Invalid type');
    }
    if (!questionId) {
        throw new BadRequestError('Question ID is required');
    }

    // Verify the question exists
    const question = await Question.findById(questionId);
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    // Check if already submitted
    const existingSubmission = await UserSubmission.findOne({ userId, questionId });
    if (existingSubmission) {
        throw new BadRequestError('Question already submitted');
    }

    // Create submission
    await UserSubmission.create({
        userId,
        questionId,
        topic,
        type,
        status: 'done',
    });

    res.status(StatusCodes.OK).json({ msg: 'Answer submitted' });
};
/**
 * @swagger
 * /api/v1/training/{topic}/{type}/submissions:
 *   get:
 *     summary: Get user submissions for a specific topic and training type
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CSS, HTML, JavaScript, React, NodeJS]
 *         description: The topic of the submissions
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [flashcard, quiz, codingChallenge]
 *         description: The type of training
 *     responses:
 *       200:
 *         description: List of user submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   questionId:
 *                     type: string
 *                   topic:
 *                     type: string
 *                   type:
 *                     type: string
 *                   status:
 *                     type: string
 *       400:
 *         description: Invalid topic or type
 *       401:
 *         description: Authentication invalid
 */
export const getSubmissions = async (req: AuthenticatedRequest, res: Response) => {
    const { topic, type } = req.params;
    const userId = req.user?.userId;

    const validTopics = ['CSS', 'HTML', 'JavaScript', 'React', 'NodeJS'];
    const validTypes = ['flashcard', 'quiz', 'codingChallenge'];

    if (!validTopics.includes(topic)) {
        throw new BadRequestError('Invalid topic');
    }
    if (!validTypes.includes(type)) {
        throw new BadRequestError('Invalid type');
    }

    const submissions = await UserSubmission.find({ userId, topic, type });
    res.status(StatusCodes.OK).json(submissions);
};
