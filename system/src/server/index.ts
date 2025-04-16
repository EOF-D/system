import cors from "cors";
import express from "express";
import morgan from "morgan";
import { Config } from "./config/config";
import { initializeDatabase } from "./config/database";
import { baseRouter } from "./routes/baseRoutes";
import { courseRouter } from "./routes/courseRoutes";
import { enrollmentRouter } from "./routes/enrollmentRoutes";
import { quizRouter } from "./routes/quizRoutes";
import { submissionRouter } from "./routes/submissionRoutes";
import { userRouter } from "./routes/userRoutes";
import { logger } from "../shared/utils/logger";

const app = express();
const port = Config.port;

// Middleware.
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // For logging.

// Routes.
app.use("/api", baseRouter);
app.use("/api/courses", courseRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/users", userRouter);

export const startServer = async () => {
  try {
    // Initialize database.
    await initializeDatabase();

    // Start server.
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();
