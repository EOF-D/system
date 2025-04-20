import { Config } from "@server/config/config";
import { initializeDatabase } from "@server/config/database";
import { baseRouter } from "@server/routes/baseRoutes";
import { courseRouter } from "@server/routes/courseRoutes";
import { enrollmentRouter } from "@server/routes/enrollmentRoutes";
import { quizRouter } from "@server/routes/quizRoutes";
import { submissionRouter } from "@server/routes/submissionRoutes";
import { userRouter } from "@server/routes/userRoutes";
import { logger } from "@shared/utils/logger";
import cors from "cors";
import express from "express";
import morgan from "morgan";

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
