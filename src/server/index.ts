import cors from "cors";
import express from "express";
import morgan from "morgan";
import { Config } from "./config/config";
import { initializeDatabase } from "./config/database";

import router from "./routes/baseRoutes";
import userRouter from "./routes/userRoutes";
import enrollmentRouter from "./routes/enrollmentRoutes";

const app = express();
const port = Config.port;

// Middleware.
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // For logging.

// Routes.
app.use(router);
app.use("/api/users", userRouter);
app.use("/api/enrollments", enrollmentRouter);

const startServer = async () => {
  try {
    // Initialize database.
    await initializeDatabase();

    // Start server.
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
