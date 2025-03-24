import dotenv from "dotenv";
import app from "./app";
import connectDB from "./db/connect";

dotenv.config();
const PORT = process.env.PORT || 8000;

// Start Server
const start = async (): Promise<void> => {
    try {
        await connectDB(process.env.MONGO_URI as string);
        app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
    } catch (error) {
        console.error("Error starting server:", error);
    }
};

start();
