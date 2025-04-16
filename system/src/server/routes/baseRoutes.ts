import { Response, Router } from "express";

export const baseRouter = Router();

/**
 * Health check endpoint.
 * @route GET /api/health
 * @description Returns the status of the server.
 * @access Public
 */
baseRouter.get("/health", (_, res: Response) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});
