import { CourseItemModel } from "@server/models/courseItemModel";
import { CourseModel } from "@server/models/courseModel";
import { EnrollmentModel } from "@server/models/enrollmentModel";
import { GradeModel } from "@server/models/gradeModel";
import { SubmissionModel } from "@server/models/submissionModel";
import { UserModel } from "@server/models/userModel";
import { logger } from "@shared/utils/logger";
import { Request, Response } from "express";

/**
 * Grade a course item submission.
 * @route POST /api/grades
 * @access Professor (own courses only)
 */
export const gradeSubmission = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can grade submissions",
    });
    return;
  }

  try {
    const { enrollment_id, item_id, points_earned } = req.body;

    // Validate required fields.
    if (
      enrollment_id === undefined ||
      item_id === undefined ||
      points_earned === undefined
    ) {
      res.status(400).json({
        success: false,
        message: "Enrollment ID, item ID, and points earned are required",
      });
      return;
    }

    const enrollmentId = parseInt(enrollment_id);
    const itemId = parseInt(item_id);
    const pointsEarned = parseFloat(points_earned);

    // Validate points earned is a positive number.
    if (isNaN(pointsEarned) || pointsEarned < 0) {
      res.status(400).json({
        success: false,
        message: "Points earned must be a non-negative number",
      });
      return;
    }

    // Check if the course item exists.
    const courseItem = await CourseItemModel.findById(itemId);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    // Check if the professor is associated with the course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to grade items for this course",
      });
      return;
    }

    // Check if the enrollment exists and is associated with this course.
    const enrollments = await CourseModel.getEnrollmentsForCourse(
      courseItem.course_id
    );

    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "Enrollment not found for this course",
      });
      return;
    }

    // Create or update the grade.
    const grade = await GradeModel.createOrUpdateGrade({
      enrollment_id: enrollmentId,
      item_id: itemId,
      points_earned: pointsEarned,
    });

    // Update submission status to graded if it exists.
    const submission = await SubmissionModel.findByEnrollmentAndItemId(
      enrollmentId,
      itemId
    );

    if (submission) {
      await SubmissionModel.update(submission.id, { status: "graded" });
    }

    res.status(200).json({
      success: true,
      data: grade,
      message: "Submission graded successfully",
    });
  } catch (error: any) {
    logger.error(`Error grading submission: ${error}`);
    if (error.message.includes("Points earned cannot exceed max points")) {
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
 * Get all grades for a student in a course.
 * @route GET /api/grades/course/:id/student/:studentId
 * @access Professor (own courses only)
 */
export const getStudentGradesForCourse = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can view student grades",
    });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const studentId = parseInt(req.params.studentId);

    // Check if the course exists and belongs to the professor.
    const course = await CourseModel.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view grades for this course",
      });
      return;
    }

    // Check if the student is enrolled in the course.
    const enrollments = await CourseModel.getEnrollmentsForCourse(courseId);
    const enrollment = enrollments.find((e) => e.student_id === studentId);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "Student not enrolled in this course",
      });
      return;
    }

    const grades = await GradeModel.getGradesByEnrollmentId(enrollment.id);
    const studentInfo = await UserModel.findById(studentId);
    res.status(200).json({
      success: true,
      data: {
        student: studentInfo,
        grades: grades,
      },
    });
  } catch (error) {
    logger.error(`Error getting student grades: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all grades for a course item.
 * @route GET /api/grades/item/:itemId
 * @access Professor (own courses only)
 */
export const getGradesByItemId = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can view item grades",
    });
    return;
  }

  try {
    const itemId = parseInt(req.params.itemId);

    // Check if the course item exists.
    const courseItem = await CourseItemModel.findById(itemId);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    // Check if the professor is associated with the course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view grades for this course",
      });
      return;
    }

    const grades = await GradeModel.getGradesByItemId(itemId);
    res.status(200).json({
      success: true,
      data: grades,
    });
  } catch (error) {
    logger.error(`Error getting item grades: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all grades for the current student.
 * @route GET /api/grades/me/course/:id
 * @access Private
 */
export const getMyGradesForCourse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);

    // Check if the student is enrolled in the course.
    const enrollments = await EnrollmentModel.getByStudentId(
      req.user.id,
      "active"
    );

    const enrollment = enrollments.find((e) => e.course_id === courseId);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
      return;
    }

    const grades = await GradeModel.getGradesByEnrollmentId(enrollment.id);

    // Get course items that don't have grades yet.
    const courseItems = await CourseItemModel.findByCourseId(courseId);
    const gradedItemIds = grades.map((g) => g.item_id);
    const ungradedItems = courseItems.filter(
      (item) => !gradedItemIds.includes(item.id) && item.type !== "document"
    );

    res.status(200).json({
      success: true,
      data: {
        grades: grades,
        ungraded_items: ungradedItems,
        final_grade: enrollment.final_grade || null,
      },
    });
  } catch (error) {
    logger.error(`Error getting student grades: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Calculate final grades for all students in a course.
 * @route POST /api/grades/finalize/course/:id
 * @access Professor (own courses only)
 */
export const finalizeGradesForCourse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can finalize grades",
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
        message: "You don't have permission to finalize grades for this course",
      });
      return;
    }

    // Get all active enrollments for the course.
    const enrollments = await CourseModel.getEnrollmentsForCourse(courseId);

    // Calculate and update final grade for each student.
    const results = await Promise.all(
      enrollments.map(async (enrollment) => {
        const finalGrade = await GradeModel.updateFinalGrade(
          courseId,
          enrollment.student_id
        );
        return {
          student_id: enrollment.student_id,
          final_grade: finalGrade,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: results,
      message: "Final grades calculated successfully",
    });
  } catch (error) {
    logger.error(`Error finalizing grades: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
