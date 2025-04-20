import {
  finalizeGradesForCourse,
  getGradesByItemId,
  getMyGradesForCourse,
  getStudentGradesForCourse,
  gradeSubmission,
} from "@server/controllers/gradeController";
import { professorOnly, protect } from "@server/middleware/auth";
import express from "express";

export const gradeRouter = express.Router();

// Protected routes - require authentication.
gradeRouter.use(protect);

/**
 * @route GET /api/grades/me/course/:id
 * @description Get all grades for the current student in a course.
 * @access Private
 */
gradeRouter.get("/me/course/:id", getMyGradesForCourse);

// Professor-only routes.
gradeRouter.use(professorOnly);

/**
 * @route POST /api/grades
 * @description Grade a course item submission.
 * @access Professor (own courses only)
 */
gradeRouter.post("/", gradeSubmission);

/**
 * @route GET /api/grades/course/:id/student/:studentId
 * @description Get all grades for a student in a course.
 * @access Professor (own courses only)
 */
gradeRouter.get("/course/:id/student/:studentId", getStudentGradesForCourse);

/**
 * @route GET /api/grades/item/:itemId
 * @description Get all grades for a course item.
 * @access Professor (own courses only)
 */
gradeRouter.get("/item/:itemId", getGradesByItemId);

/**
 * @route POST /api/grades/finalize/course/:id
 * @description Calculate final grades for all students in a course.
 * @access Professor (own courses only)
 */
gradeRouter.post("/finalize/course/:id", finalizeGradesForCourse);
