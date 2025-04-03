import dotenv from "dotenv";
import app from "./app";
import connectDB from "./db/connect";

dotenv.config();

const PORT: number = parseInt(process.env.PORT as string, 10) || 8000;

const start = async (): Promise<void> => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is listening on port ${PORT}...`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

start();
