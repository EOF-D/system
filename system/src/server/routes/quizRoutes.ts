import express from "express";
import {
  calculateQuizScore,
  createQuizQuestion,
  getQuizQuestions,
  getQuizResponses,
  submitQuizResponse,
} from "../controllers/quizController";
import { professorOnly, protect } from "../middleware/auth";

export const quizRouter = express.Router();

// Protected routes - require authentication
quizRouter.use(protect);

/**
 * @route POST /api/quizzes/responses
 * @description Submit a response to a quiz question.
 * @access Private (students only)
 */
quizRouter.post("/responses", submitQuizResponse);

/**
 * @route GET /api/quizzes/:itemId/questions
 * @description Get all questions for a quiz.
 * @access Private (professors and enrolled students)
 */
quizRouter.get("/:itemId/questions", getQuizQuestions);

/**
 * @route GET /api/quizzes/submissions/:submissionId/responses
 * @description Get all responses for a quiz submission.
 * @access Private (students can only see their own, professors can see all)
 */
quizRouter.get("/submissions/:submissionId/responses", getQuizResponses);

// Professor-only routes.
quizRouter.use(professorOnly);

/**
 * @route POST /api/quizzes/questions
 * @description Create a new quiz question.
 * @access Private (professors only)
 */
quizRouter.post("/questions", createQuizQuestion);

/**
 * @route POST /api/quizzes/submissions/:submissionId/score
 * @description Calculate score for a quiz submission.
 * @access Private (professors only)
 */
quizRouter.post("/submissions/:submissionId/score", calculateQuizScore);
