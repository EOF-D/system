import {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  getSubmissionsByItemId,
  updateSubmission,
} from "@server/controllers/submissionController";
import { professorOnly, protect } from "@server/middleware/auth";
import express from "express";

export const submissionRouter = express.Router();

// Protected routes - require authentication.
submissionRouter.use(protect);

/**
 * @route POST /api/submissions
 * @description Create a new submission.
 * @access Private (students only)
 */
submissionRouter.post("/", createSubmission);

/**
 * @route GET /api/submissions
 * @description Get all submissions for the current user.
 * @access Private
 */
submissionRouter.get("/", getMySubmissions);

/**
 * @route GET /api/submissions/:id
 * @description Get a specific submission by ID.
 * @access Private (students can only view their own submissions, professors can view all)
 */
submissionRouter.get("/:id", getSubmissionById);

/**
 * @route PUT /api/submissions/:id
 * @description Update a submission.
 * @access Private (students can only update their own submissions)
 */
submissionRouter.put("/:id", updateSubmission);

/**
 * @route GET /api/submissions/item/:itemId
 * @description Get all submissions for a course item.
 * @access Private (professors only)
 */
submissionRouter.get("/item/:itemId", professorOnly, getSubmissionsByItemId);
