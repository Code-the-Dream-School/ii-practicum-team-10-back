import { Request, Response } from "express";
import User from "../models/User";
import { StatusCodes } from "http-status-codes";

export const getUserProgress = async (req: Request, res: Response) => {
    const { id } = req.params; // Extract userId from URL
    const user = await User.findById(id);

    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    res.status(StatusCodes.OK).json({ progress: user.progress });
};

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
