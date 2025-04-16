import { Request, Response } from "express";
import { CourseModel } from "../models/courseModel";
import { EnrollmentModel } from "../models/enrollmentModel";
import { UpdateCourseInput } from "../../shared/types/models/course";
import { logger } from "../utils/logger";

/**
 * Create a new course.
 * @route POST /api/courses
 * @access Professor
 */
export const createCourse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can create courses",
    });

    return;
  }

  try {
    const { name, prefix, number, room, start_time, end_time, days } = req.body;

    // Validate required fields.
    if (
      !name ||
      !prefix ||
      !number ||
      !room ||
      !start_time ||
      !end_time ||
      !days
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });

      return;
    }

    const courseData = {
      professor_id: req.user.id,
      name,
      prefix,
      number,
      room,
      start_time,
      end_time,
      days,
    };

    const course = await CourseModel.create(courseData);
    res.status(201).json({
      success: true,
      data: course,
      message: "Course created successfully",
    });
  } catch (error: any) {
    logger.error(`Error creating course: ${error}`);
    if (error.message.includes("professor")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a course.
 * @route PUT /api/courses/:id
 * @access Professor (own courses only)
 */
export const updateCourse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can update courses",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);

    // Check if course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });

      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to update this course",
      });

      return;
    }

    const { name, prefix, number, room, start_time, end_time, days } = req.body;

    // Build update data.
    const updateData: UpdateCourseInput = {};
    if (name !== undefined) updateData.name = name;
    if (prefix !== undefined) updateData.prefix = prefix;
    if (number !== undefined) updateData.number = number;
    if (room !== undefined) updateData.room = room;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (days !== undefined) updateData.days = days;

    // If nothing to update.
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "No fields to update",
      });

      return;
    }

    // Update course.
    const updatedCourse = await CourseModel.update(courseId, updateData);
    res.status(200).json({
      success: true,
      data: updatedCourse,
      message: "Course updated successfully",
    });
  } catch (error) {
    logger.error(`Error updating course: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a course.
 * @route DELETE /api/courses/:id
 * @access Professor (own courses only)
 */
export const deleteCourse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can delete courses",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);

    // Check if course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });

      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to delete this course",
      });

      return;
    }

    const success = await CourseModel.delete(courseId);
    if (!success) {
      res.status(500).json({
        success: false,
        message: "Failed to delete course",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting course: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get a course by ID.
 * @route GET /api/courses/:id
 * @access Private (Professors can see their own courses, students can see enrolled courses)
 */
export const getCourseById = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const role = req.user.role;

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

      // Get courses with enrollment counts.
      const coursesWithCounts = await CourseModel.findByProfessorId(
        req.user.id
      );

      const courseWithCounts = coursesWithCounts.find((c) => c.id === courseId);
      if (courseWithCounts) {
        res.status(200).json({
          success: true,
          data: courseWithCounts,
        });

        return;
      }

      // Fallback if not found in the previous query.
      res.status(200).json({
        success: true,
        data: {
          ...course,
          enrollment_count: 0,
          assignment_count: 0,
        },
      });

      return;
    }

    // For students, check if they're enrolled.
    const enrollments = await EnrollmentModel.getByStudentId(
      req.user.id,
      "active"
    );

    const enrollment = enrollments.find((e) => e.course_id === courseId);
    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: "You're not enrolled in this course",
      });

      return;
    }

    // Get course with professor details.
    const coursesWithProfessor = await CourseModel.findByStudentId(
      req.user.id,
      "active"
    );

    const courseWithProfessor = coursesWithProfessor.find(
      (c) => c.id === courseId
    );

    if (courseWithProfessor) {
      res.status(200).json({
        success: true,
        data: {
          ...courseWithProfessor,
          ...enrollment,
        },
      });

      return;
    }

    // Fallback response with basic course info.
    res.status(200).json({
      success: true,
      data: {
        ...course,
        ...enrollment,
      },
    });
  } catch (error) {
    logger.error(`Error getting course: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get courses based on user role.
 * @route GET /api/courses
 * @access Private
 */
export const getCourses = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const role = req.user.role;

    // For professors, get courses they teach.
    if (role === "professor") {
      const courses = await CourseModel.findByProfessorId(req.user.id);
      res.status(200).json({ success: true, data: courses });
      return;
    }

    // For students, get courses they're enrolled in.
    const status =
      (req.query.status as "active" | "dropped" | "completed") || "active";

    const courses = await CourseModel.findByStudentId(req.user.id, status);
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    logger.error(`Error getting courses: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all courses.
 * @route GET /api/courses
 * @access Admin
 */
export const getAllCourses = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Only professors can create courses",
    });

    return;
  }

  try {
    const courses = await CourseModel.findAll();
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    logger.error(`Error fetching all courses: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get enrollments for a course.
 * @route GET /api/courses/:id/enrollments
 * @access Professor (own courses only)
 */
export const getCourseEnrollments = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can view course enrollments",
    });

    return;
  }

  try {
    const courseId = parseInt(req.params.id);

    // Check if course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });

      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to access this course",
      });

      return;
    }

    const enrollments = await CourseModel.getEnrollmentsForCourse(courseId);
    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    logger.error(`Error getting course enrollments: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
