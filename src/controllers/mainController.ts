import { Request, Response } from "express";

export const mainController = (req: Request, res: Response) => {
    return res.json({
        data: "This is a full stack app!",
    });
};
