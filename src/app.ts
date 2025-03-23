import express, { Application } from "express";
import cors from "cors";
import favicon from "express-favicon";
import logger from "morgan";
import mainRouter from "./routes/mainRouter";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(express.static("public"));
app.use(favicon(__dirname + "/public/favicon.ico"));

// Routes
app.use("/api/v1", mainRouter);

export default app;
