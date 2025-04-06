import { Router, Response } from "express";

// This is the base router for the server.
const baseRouter = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint.
 * @access Public
 */
baseRouter.get("/api/health", (_, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

export default baseRouter;
