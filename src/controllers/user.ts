import { Request, Response } from "express";
import User from "../models/User";
import { StatusCodes } from "http-status-codes";

/**
 * @swagger
 * /api/v1/user/{id}/progress:
 *   get:
 *     summary: Get user progress
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: object
 *                   properties:
 *                     css:
 *                       type: number
 *                     html:
 *                       type: number
 *                     jsChallenges:
 *                       type: number
 *                     jsTheory:
 *                       type: number
 *       401:
 *         description: Authentication invalid
 *       404:
 *         description: User not found
 */

export const getUserProgress = async (req: Request, res: Response) => {
    const { id } = req.params; // Extract userId from URL
    const user = await User.findById(id);

    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    res.status(StatusCodes.OK).json({ progress: user.progress });
};
/**
 * @swagger
 * /api/v1/user/{id}/progress:
 *   post:
 *     summary: Update user progress
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress:
 *                 type: object
 *                 properties:
 *                   css:
 *                     type: number
 *                     example: 50
 *                   html:
 *                     type: number
 *                     example: 10
 *                   jsChallenges:
 *                     type: number
 *                     example: 10
 *                   jsTheory:
 *                     type: number
 *                     example: 10
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: object
 *                   properties:
 *                     css:
 *                       type: number
 *                     html:
 *                       type: number
 *                     jsChallenges:
 *                       type: number
 *                     jsTheory:
 *                       type: number
 *       400:
 *         description: Progress data is required
 *       401:
 *         description: Authentication invalid
 *       404:
 *         description: User not found
 */
export const updateUserProgress = async (req: Request, res: Response) => {
    const { id } = req.params; // Extract userId from URL
    const { progress } = req.body; // Expecting { progress: { css, html, jsChallenges, jsTheory } }

    if (!progress) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Progress data is required" });
    }

    const user = await User.findByIdAndUpdate(
        id,
        { progress }, // Directly update the progress field
        { new: true, runValidators: true }
    );

    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    res.status(StatusCodes.OK).json({ progress: user.progress });
};
