import express from "express";
import cors from "cors";
import morgan from "morgan";
import { Config } from "./config/config";
import { initializeDatabase } from "./config/database";

const app = express();
const port = Config.port;

// Middleware.
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // For logging.

// Health check endpoint.
app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

const startServer = async () => {
  try {
    // Initialize database.
    await initializeDatabase();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
