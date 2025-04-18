import { Request, Response } from "express";
import { CourseItemModel } from "../models/courseItemModel";
import { CourseModel } from "../models/courseModel";
import {
  CreateCourseItemInput,
  UpdateCourseItemInput,
} from "../../shared/types/models/courseItem";
import { logger } from "../../shared/utils/logger";

/**
 * Create a new course item.
 * @route POST /api/courses/:id/items
 * @access Professor (own courses only)
 */
export const createCourseItem = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can create course items",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);

    // Check if the course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to modify this course",
      });
      return;
    }

    const { name, type, max_points, due_date, description } = req.body;

    // Validate required fields.
    if (!name || !type || !due_date || !description) {
      res.status(400).json({
        success: false,
        message: "Name, type, and due date are required",
      });

      return;
    }

    // Set default value for max_points if not provided.
    const maxPoints =
      max_points !== undefined ? max_points : type === "document" ? 0 : 100;

    const itemData: CreateCourseItemInput = {
      course_id: courseId,
      name,
      type,
      max_points: maxPoints,
      due_date,
      description,
    };

    const newItem = await CourseItemModel.create(itemData);
    res.status(201).json({
      success: true,
      data: newItem,
      message: "Course item created successfully",
    });
  } catch (error) {
    logger.error(`Error creating course item: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a course item.
 * @route PUT /api/courses/:id/items/:itemId
 * @access Professor (own courses only)
 */
export const updateCourseItem = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can update course items",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    // Check if the course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to modify this course",
      });

      return;
    }

    // Check if the course item exists and belongs to this course.
    const item = await CourseItemModel.findById(itemId);
    if (!item) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });

      return;
    }

    if (item.course_id !== courseId) {
      res.status(404).json({
        success: false,
        message: "Course item not found in this course",
      });

      return;
    }

    const { name, type, max_points, due_date, description } = req.body;

    const updateData: UpdateCourseItemInput = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (max_points !== undefined) updateData.max_points = max_points;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (description !== undefined) updateData.description = description;

    // If nothing to update.
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields to update",
      });

      return;
    }

    // Update the course item.
    const updatedItem = await CourseItemModel.update(itemId, updateData);
    res.status(200).json({
      success: true,
      data: updatedItem,
      message: "Course item updated successfully",
    });
  } catch (error) {
    logger.error("Error updating course item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a course item.
 * @route DELETE /api/courses/:id/items/:itemId
 * @access Professor (own courses only)
 */
export const deleteCourseItem = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can delete course items",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);

    // Check if the course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to modify this course",
      });

      return;
    }

    // Check if the course item exists and belongs to this course.
    const item = await CourseItemModel.findById(itemId);
    if (!item) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });

      return;
    }

    if (item.course_id !== courseId) {
      res.status(404).json({
        success: false,
        message: "Course item not found in this course",
      });

      return;
    }

    // Delete the course item.
    const success = await CourseItemModel.delete(itemId);
    if (!success) {
      res.status(500).json({
        success: false,
        message: "Failed to delete course item",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Course item deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting course item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all course items for a course.
 * @route GET /api/courses/:id/items
 * @access Private (professors can see their own courses, students can see enrolled courses)
 */
export const getCourseItems = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const role = req.user.role;

    // Check if the course exists.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // For professors, check if they own the course.
    if (role === "professor") {
      if (course.professor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "You don't have permission to access this course",
        });

        return;
      }
    } else {
      // For students, check if they're enrolled.
      const enrollments = await CourseModel.getEnrollmentsForCourse(courseId);
      const student_ids = enrollments.map((e) => e.student_id);

      if (!student_ids.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          message: "You're not enrolled in this course",
        });

        return;
      }
    }

    const items = await CourseItemModel.findByCourseId(courseId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error(`Error getting course items: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get a specific course item.
 * @route GET /api/courses/:id/items/:itemId
 * @access Private (professors can see their own courses, students can see enrolled courses)
 */
export const getCourseItemById = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const role = req.user.role;

    // Check if the course exists.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // For professors, check if they own the course.
    if (role === "professor") {
      if (course.professor_id !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "You don't have permission to access this course",
        });

        return;
      }
    } else {
      // For students, check if they're enrolled.
      const enrollments = await CourseModel.getEnrollmentsForCourse(courseId);
      const student_ids = enrollments.map((e) => e.student_id);

      if (!student_ids.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          message: "You're not enrolled in this course",
        });

        return;
      }
    }

    // Get the course item.
    const item = await CourseItemModel.findById(itemId);
    if (!item) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });

      return;
    }

    // Verify the item belongs to the course.
    if (item.course_id !== courseId) {
      res.status(404).json({
        success: false,
        message: "Course item not found in this course",
      });

      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    logger.error("Error getting course item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get upcoming course items for the current student.
 * @route GET /api/courses/upcoming
 * @access Private (students only)
 */
export const getUpcomingItems = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const items = await CourseItemModel.getUpcomingForStudent(
      req.user.id,
      limit
    );

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error("Error getting upcoming items:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
