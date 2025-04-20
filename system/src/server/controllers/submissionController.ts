import { CourseItemModel } from "@server/models/courseItemModel";
import { CourseModel } from "@server/models/courseModel";
import { EnrollmentModel } from "@server/models/enrollmentModel";
import { QuizModel } from "@server/models/quizModel";
import { SubmissionModel } from "@server/models/submissionModel";
import { logger } from "@shared/utils/logger";
import { Request, Response } from "express";

/**
 * Create or update a submission.
 * @route POST /api/submissions
 * @access Private (students only)
 */
export const createSubmission = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const { item_id, content, status } = req.body;

    // Validate required fields.
    if (!item_id) {
      res.status(400).json({
        success: false,
        message: "Course item ID is required",
      });
      return;
    }

    // Get the course item to check if it allows submissions.
    const courseItem = await CourseItemModel.findById(parseInt(item_id));
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    // Ensure the item is an assignment or quiz.
    if (courseItem.type !== "assignment" && courseItem.type !== "quiz") {
      res.status(400).json({
        success: false,
        message: "Submissions are only allowed for assignments and quizzes",
      });
      return;
    }

    // Get the user's enrollment for this course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Find the active enrollment for this student in this course.
    const enrollments = await EnrollmentModel.getByStudentId(
      req.user.id,
      "active"
    );

    const enrollment = enrollments.find(
      (e) => e.course_id === courseItem.course_id
    );

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
      return;
    }

    // Create the submission.
    const submissionData = {
      enrollment_id: enrollment.id,
      item_id: parseInt(item_id),
      content: content || null,
      status: status || "draft",
    };

    const submission = await SubmissionModel.create(submissionData);
    res.status(201).json({
      success: true,
      data: submission,
      message: "Submission created successfully",
    });
  } catch (error) {
    logger.error(`Error creating submission: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a submission.
 * @route PUT /api/submissions/:id
 * @access Private (students can only update their own submissions)
 */
export const updateSubmission = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const submissionId = parseInt(req.params.id);
    const { content, status } = req.body;

    // Get the current submission.
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    // Check if the submission belongs to the current user.
    const enrollments = await EnrollmentModel.getByStudentId(
      req.user.id,
      "active"
    );

    const hasEnrollment = enrollments.some(
      (e) => e.id === submission.enrollment_id
    );

    if (!hasEnrollment) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to update this submission",
      });
      return;
    }

    // Update the submission.
    const updateData = {
      content: content,
      status: status,
    };

    const updatedSubmission = await SubmissionModel.update(
      submissionId,
      updateData
    );

    res.status(200).json({
      success: true,
      data: updatedSubmission,
      message: "Submission updated successfully",
    });
  } catch (error) {
    logger.error(`Error updating submission: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get a specific submission by ID.
 * @route GET /api/submissions/:id
 * @access Private (students can only view their own submissions, professors can view all submissions for their courses)
 */
export const getSubmissionById = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const submissionId = parseInt(req.params.id);
    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    // Check if the submission belongs to the current user or a professor of the course.
    const course = await CourseModel.findById(submission.item_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const isProfessor =
      req.user.role === "professor" && course.professor_id === req.user.id;

    const isStudent = req.user.role === "user";

    // If the user is a student, ensure they are viewing their own submission.
    if (isStudent) {
      const enrollments = await EnrollmentModel.getByStudentId(
        req.user.id,
        "active"
      );

      const hasEnrollment = enrollments.some(
        (e) => e.id === submission.enrollment_id
      );

      if (!hasEnrollment) {
        res.status(403).json({
          success: false,
          message: "You don't have permission to view this submission",
        });
        return;
      }
    } else if (!isProfessor) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view this submission",
      });
      return;
    }

    // If it's a quiz submission, get the responses.
    if (submission.item_type === "quiz") {
      const responses = await QuizModel.getSubmissionResponses(submissionId);
      const quizQuestions = await QuizModel.getQuizQuestions(
        submission.item_id
      );

      res.status(200).json({
        success: true,
        data: {
          ...submission,
          responses,
          questions: quizQuestions,
        },
      });
      return;
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    logger.error(`Error getting submission: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all submissions for the current student.
 * @route GET /api/submissions
 * @access Private
 */
export const getMySubmissions = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = req.query.course_id
      ? parseInt(req.query.course_id as string)
      : undefined;

    const submissions = await SubmissionModel.findByStudentId(
      req.user.id,
      courseId
    );

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    logger.error(`Error getting submissions: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all submissions for a course item.
 * @route GET /api/submissions/item/:itemId
 * @access Private (professors only for their own courses)
 */
export const getSubmissionsByItemId = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can view all submissions for an item",
    });
    return;
  }

  try {
    const itemId = parseInt(req.params.itemId);

    // Get the course item to check if it belongs to the professor.
    const courseItem = await CourseItemModel.findById(itemId);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    // Get the course to check if it belongs to the professor.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view these submissions",
      });
      return;
    }

    const submissions = await SubmissionModel.findByItemId(itemId);
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    logger.error(`Error getting submissions by item ID: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
