import dotenv from "dotenv";
dotenv.config();
import "express-async-errors";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import favicon from "express-favicon";
import logger from "morgan";



//import authenticateUser from "./middleware/authentication";

import authRouter from "./routes/auth";
import userRouter from "./routes/user";

import notFoundMiddleware from "./middleware/not-found";
import errorHandlerMiddleware from "./middleware/error-handler";

const app: Application = express();



// Middleware
app.use(cors({
    origin: process.env.BASE_URL_FRONT, // Allow requests from frontend
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: "GET,POST,PUT,DELETE,PATCH", // Allow specific HTTP methods
    allowedHeaders: "Content-Type,Authorization", // Allow required headers
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/favicon.ico"));


// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
// Error Handling
app.use(notFoundMiddleware);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    errorHandlerMiddleware(err, req, res, next);
});

export default app;
