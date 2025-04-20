import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourseEnrollments,
  getCourses,
  updateCourse,
} from "@server/controllers/courseController";
import {
  createCourseItem,
  deleteCourseItem,
  getCourseItemById,
  getCourseItems,
  getUpcomingItems,
  updateCourseItem,
} from "@server/controllers/courseItemController";
import { professorOnly, protect } from "@server/middleware/auth";
import express from "express";

export const courseRouter = express.Router();

// Protected routes - require authentication.
courseRouter.use(protect);

/**
 * @route GET /api/courses
 * @description Get all courses for the current user.
 * @access Private
 */
courseRouter.get("/", getCourses);

/**
 * @route GET /api/courses/:id
 * @description Get a specific course by ID.
 * @access Private
 */
courseRouter.get("/:id", getCourseById);

/**
 * @route GET /api/courses/upcoming
 * @description Get upcoming course items for the current student.
 * @access Private
 */
courseRouter.get("/upcoming", getUpcomingItems);

/**
 * @route GET /api/courses/:id/items
 * @description Get all items for a course.
 * @access Private (students and professors)
 */
courseRouter.get("/:id/items", getCourseItems);

/**
 * @route GET /api/courses/:id/items/:itemId
 * @description Get a specific course item.
 * @access Private (students and professors)
 */
courseRouter.get("/:id/items/:itemId", getCourseItemById);

// Professor-only routes.
courseRouter.use(professorOnly);

/**
 * @route GET /api/courses/:id/enrollments
 * @description Get all student enrollments for a specific course.
 * @access Professor (own courses only)
 */
courseRouter.get("/:id/enrollments", getCourseEnrollments);

/**
 * @route POST /api/courses
 * @description Create a new course.
 * @access Professor
 */
courseRouter.post("/", createCourse);

/**
 * @route PUT /api/courses/:id
 * @description Update a course.
 * @access Professor (own courses only)
 */
courseRouter.put("/:id", updateCourse);

/**
 * @route DELETE /api/courses/:id
 * @description Delete a course.
 * @access Professor (own courses only)
 */
courseRouter.delete("/:id", deleteCourse);

/**
 * @route POST /api/courses/:id/items
 * @description Create a new course item.
 * @access Professor (own courses only)
 */
courseRouter.post("/:id/items", createCourseItem);

/**
 * @route PUT /api/courses/:id/items/:itemId
 * @description Update a course item.
 * @access Professor (own courses only)
 */
courseRouter.put("/:id/items/:itemId", updateCourseItem);

/**
 * @route DELETE /api/courses/:id/items/:itemId
 * @description Delete a course item.
 * @access Professor (own courses only)
 */
courseRouter.delete("/:id/items/:itemId", deleteCourseItem);
