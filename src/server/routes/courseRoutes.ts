import express from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourseEnrollments,
  getCourses,
  updateCourse,
} from "../controllers/courseController";
import { professorOnly, protect } from "../middleware/authMiddleware";

// This is the course router for the server.
const router = express.Router();

// All routes require authentication.
router.use(protect);

/**
 * @route   GET /api/courses
 * @desc    Get all courses for the current user.
 * @access  Private
 */
router.get("/", getCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get a specific course by ID.
 * @access  Private
 */
router.get("/:id", getCourseById);

// Professor-only routes.
router.use(professorOnly);

/**
 * @route   GET /api/courses/:id/enrollments
 * @desc    Get all student enrollments for a specific course.
 * @access  Professor (own courses only)
 */
router.get("/:id/enrollments", getCourseEnrollments);

/**
 * @route   POST /api/courses
 * @desc    Create a new course.
 * @access  Professor
 */
router.post("/", createCourse);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update a course.
 * @access  Professor (own courses only)
 */
router.put("/:id", updateCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course.
 * @access  Professor (own courses only)
 */
router.delete("/:id", deleteCourse);

export default router;
