import {NextFunction, Request, Response} from 'express';
import { StatusCodes } from 'http-status-codes';
import Question from '../models/Question';
import UserSubmission from '../models/UserSubmission';
import { AuthenticatedRequest } from '../middleware/authentication';
import { BadRequestError, NotFoundError } from '../errors';

type SortOptions = {
    [key: string]: 1 | -1;
};

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
 *                   questionSuggestedAnswers:
 *                     type: array
 *                     items:
 *                       type: string
 *                   tests:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         input:
 *                           type: string
 *                         expectedOutput:
 *                           type: string
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
        questionSuggestedAnswers: question.questionSuggestedAnswers,
        tests: question.tests,
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

    const question = await Question.findById(questionId);
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    const existingSubmission = await UserSubmission.findOne({ userId, questionId });
    if (existingSubmission) {
        throw new BadRequestError('Question already submitted');
    }

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

/**
 * @swagger
 * /api/v1/training/questions:
 *   post:
 *     summary: Create a new question (Admin only)
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - type
 *               - questionText
 *               - answers
 *             properties:
 *               topic:
 *                 type: string
 *                 enum: [CSS, HTML, JavaScript, React, NodeJS]
 *                 description: The topic of the question
 *               type:
 *                 type: string
 *                 enum: [flashcard, quiz, codingChallenge]
 *                 description: The type of training
 *               codeSnippet:
 *                 type: string
 *                 description: Optional code snippet for coding challenges
 *               questionText:
 *                 type: string
 *                 description: The text of the question
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of correct answers
 *               questionSuggestedAnswers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Suggested answers for quiz questions (required for quizzes)
 *               tests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                 description: Test cases for coding challenges (required for coding challenges)
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     topic:
 *                       type: string
 *                     type:
 *                       type: string
 *                     codeSnippet:
 *                       type: string
 *                     questionText:
 *                       type: string
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     questionSuggestedAnswers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                           expectedOutput:
 *                             type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication invalid
 *       403:
 *         description: Admin access required
 */
export const createQuestion = async (req: AuthenticatedRequest, res: Response) => {
    console.log('Received request body:', req.body);
    const { topic, type, codeSnippet, questionText, answers, questionSuggestedAnswers, tests } = req.body;

    console.log('Type:', type);
    console.log('Tests:', tests);
    if (!topic || !type || !questionText) {
        throw new BadRequestError('Please provide topic, type, questionText');
    }
    const validTypes = ['flashcard', 'quiz', 'codingChallenge'];
    if (!validTypes.includes(type)) {
        throw new BadRequestError(`Invalid question type. Must be one of: ${validTypes.join(', ')}`);
    }
    // Additional validation for flashcards, quizzes, and coding challenges
    if (type === 'flashcard' && (!answers || !Array.isArray(answers) || answers.length === 0)) {
        throw new BadRequestError('Flashcard questions must have answers.');
    }
    if (type === 'quiz' && (!questionSuggestedAnswers || !Array.isArray(questionSuggestedAnswers) || questionSuggestedAnswers.length < 2 || !answers || !Array.isArray(answers) || answers.length === 0)) {
        throw new BadRequestError('Quiz questions must have answers and at least 2 suggested answers');
    }
    if (type === 'codingChallenge') {
        if (!tests || !Array.isArray(tests) || tests.length < 1) {
            throw new BadRequestError('Coding challenges must have at least one test case');
        }
        for (const test of tests) {
            if (!test.input || !Array.isArray(test.input) || !('expectedOutput' in test)) {
                throw new BadRequestError('Each test case must have an "input" array and an "expectedOutput" value');
            }
        }
        if (answers?.length > 0 || questionSuggestedAnswers?.length > 0) {
            throw new BadRequestError('Coding challenges should not have answers or suggested answers');
        }
    }

    const question = await Question.create({
        topic,
        type,
        codeSnippet: codeSnippet || null,
        questionText,
        answers: answers || [],
        questionSuggestedAnswers: questionSuggestedAnswers || [],
        tests: tests || [],
    });

    res.status(StatusCodes.CREATED).json({
        question: {
            id: question._id,
            topic: question.topic,
            type: question.type,
            codeSnippet: question.codeSnippet,
            questionText: question.questionText,
            answers: question.answers,
            questionSuggestedAnswers: question.questionSuggestedAnswers,
            tests: question.tests,
        },
    });
};

/**
 * @swagger
 * /api/v1/training/questions/{id}:
 *   patch:
 *     summary: Update an existing question (Admin only)
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 enum: [CSS, HTML, JavaScript, React, NodeJS]
 *                 description: The topic of the question
 *               type:
 *                 type: string
 *                 enum: [flashcard, quiz, codingChallenge]
 *                 description: The type of training
 *               codeSnippet:
 *                 type: string
 *                 description: Optional code snippet for coding challenges
 *               questionText:
 *                 type: string
 *                 description: The text of the question
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of correct answers
 *               questionSuggestedAnswers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Suggested answers for quiz questions
 *               tests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: string
 *                 description: Test cases for coding challenges
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     topic:
 *                       type: string
 *                     type:
 *                       type: string
 *                     codeSnippet:
 *                       type: string
 *                     questionText:
 *                       type: string
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     questionSuggestedAnswers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           input:
 *                             type: string
 *                           expectedOutput:
 *                             type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication invalid
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Question not found
 */
export const updateQuestion = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { topic, type, codeSnippet, questionText, answers, questionSuggestedAnswers, tests } = req.body;

    const question = await Question.findById(id);
    if (!question) {
        throw new NotFoundError('Question not found');
    }

    if (topic) question.topic = topic;
    if (type) question.type = type;
    if (codeSnippet !== undefined) question.codeSnippet = codeSnippet;
    if (questionText) question.questionText = questionText;
    if (answers) {
        if (!Array.isArray(answers) || answers.length === 0) {
            throw new BadRequestError('Answers must be a non-empty array');
        }
        question.answers = answers;
    }
    if (questionSuggestedAnswers) {
        if (question.type === 'quiz' && (!Array.isArray(questionSuggestedAnswers) || questionSuggestedAnswers.length < 2)) {
            throw new BadRequestError('Quiz questions must have at least 2 suggested answers');
        }
        question.questionSuggestedAnswers = questionSuggestedAnswers;
    }
    if (tests) {
        if (question.type === 'codingChallenge' && (!Array.isArray(tests) || tests.length < 1)) {
            throw new BadRequestError('Coding challenges must have at least 1 test case');
        }
        question.tests = tests;
    }

    await question.save();

    res.status(StatusCodes.OK).json({
        question: {
            id: question._id,
            topic: question.topic,
            type: question.type,
            codeSnippet: question.codeSnippet,
            questionText: question.questionText,
            answers: question.answers,
            questionSuggestedAnswers: question.questionSuggestedAnswers,
            tests: question.tests,
        },
    });
};
/**
 * @swagger
 * /api/v1/training/questions/{id}:
 *   delete:
 *     summary: Delete a question (Admin only)
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the question to delete
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *       401:
 *         description: Authentication invalid
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Question not found
 */
export const deleteQuestion = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
        throw new NotFoundError('Question not found');
    }
    // Optionally, delete related UserSubmissions
    await UserSubmission.deleteMany({ questionId: id });
    res.status(StatusCodes.OK).json({ msg: 'Question deleted' });
};
/**
 * @swagger
 * /api/v1/training/questions:
 *   get:
 *     summary: Get all questions with sorting (Admin only)
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort fields (e.g., "topic,-type" for topic ascending, type descending)
 *         example: topic,-type
 *     responses:
 *       200:
 *         description: List of all questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized - JWT token required
 */
export const getAllQuestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { sort } = req.query;

        let sortOptions = {};
        if (sort) {
            const sortFields = (sort as string).split(',').reduce((acc: SortOptions, field: string) => {
                if (field.startsWith('-')) {
                    acc[field.substring(1)] = -1; // Descending
                } else {
                    acc[field] = 1; // Ascending
                }
                return acc;
            }, {});
            sortOptions = sortFields;
        } else {
            // Default sorting by topic (ascending) and type (ascending)
            sortOptions = { topic: 1, type: 1 };
        }

        // Fetch all questions with sorting
        const questions = await Question.find().sort(sortOptions);

        // Map the questions to the desired response format
        const formattedQuestions = questions.map((question) => ({
            id: question._id.toString(),
            topic: question.topic,
            type: question.type,
            codeSnippet: question.codeSnippet,
            questionText: question.questionText,
            answers: question.answers,
            questionSuggestedAnswers: question.questionSuggestedAnswers,
            tests: question.tests,
        }));

        res.status(200).json({ questions: formattedQuestions });
    } catch (error) {
        next(error);
    }
};
