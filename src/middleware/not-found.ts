import { Request, Response } from 'express';

const notFound = (req: Request, res: Response) => {
    res.status(404).json({ message: 'Route does not exist' });
};

export default notFound;
