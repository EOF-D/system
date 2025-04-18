import { Request, Response } from "express";
import { CourseItemModel } from "../models/courseItemModel";
import { CourseModel } from "../models/courseModel";
import { QuizModel } from "../models/quizModel";
import { SubmissionModel } from "../models/submissionModel";
import { logger } from "../../shared/utils/logger";

/**
 * Create a new quiz question.
 * @route POST /api/quizzes/questions
 * @access Private (professors only)
 */
export const createQuizQuestion = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can create quiz questions",
    });
    return;
  }

  try {
    const { item_id, question_text, question_type, points, options } = req.body;

    // Validate required fields.
    if (!item_id || !question_text || !question_type) {
      res.status(400).json({
        success: false,
        message: "Item ID, question text, and question type are required",
      });
      return;
    }

    // Get the course item to check if it's a quiz.
    const courseItem = await CourseItemModel.findById(parseInt(item_id));
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    if (courseItem.type !== "quiz") {
      res.status(400).json({
        success: false,
        message: "Questions can only be added to quizzes",
      });
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
        message: "You don't have permission to add questions to this quiz",
      });
      return;
    }

    // For multiple choice questions, validate that options are provided.
    if (
      question_type === "multiple_choice" &&
      (!options || options.length < 2)
    ) {
      res.status(400).json({
        success: false,
        message: "Multiple choice questions require at least 2 options",
      });
      return;
    }

    // Create the question.
    const questionData = {
      item_id: parseInt(item_id),
      question_text,
      question_type,
      points: points || 1,
      options,
    };

    const question = await QuizModel.createQuestion(questionData);
    res.status(201).json({
      success: true,
      data: question,
      message: "Quiz question created successfully",
    });
  } catch (error) {
    logger.error(`Error creating quiz question: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Submit a response to a quiz question.
 * @route POST /api/quizzes/responses
 * @access Private (students only)
 */
export const submitQuizResponse = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const { submission_id, question_id, response } = req.body;

    // Validate required fields.
    if (!submission_id || !question_id || response === undefined) {
      res.status(400).json({
        success: false,
        message: "Submission ID, question ID, and response are required",
      });
      return;
    }

    // Get the submission to check if it belongs to the current user.
    const submission = await SubmissionModel.findById(parseInt(submission_id));
    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    // Verify the submission belongs to the user.
    const student_id = req.user.id;
    const enrollments = await CourseModel.getEnrollmentsForCourse(
      submission.item_id
    );

    const userEnrollment = enrollments.find(
      (e) => e.student_id === student_id && e.id === submission.enrollment_id
    );

    if (!userEnrollment) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to submit a response for this quiz",
      });
      return;
    }

    // Create the response.
    const responseData = {
      submission_id: parseInt(submission_id),
      question_id: parseInt(question_id),
      response,
    };

    const quizResponse = await QuizModel.submitResponse(responseData);
    res.status(201).json({
      success: true,
      data: quizResponse,
      message: "Response submitted successfully",
    });
  } catch (error) {
    logger.error(`Error submitting quiz response: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all questions for a quiz.
 * @route GET /api/quizzes/:itemId/questions
 * @access Private (professors can see all questions, students can only see questions for courses they're enrolled in)
 */
export const getQuizQuestions = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const itemId = parseInt(req.params.itemId);

    // Get the course item to check if it's a quiz.
    const courseItem = await CourseItemModel.findById(itemId);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    if (courseItem.type !== "quiz") {
      res.status(400).json({
        success: false,
        message: "This item is not a quiz",
      });
      return;
    }

    // Get the course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Check permissions.
    const isProfessor =
      req.user.role === "professor" && course.professor_id === req.user.id;

    const isStudent = req.user.role === "user";

    if (!isProfessor && !isStudent) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view these questions",
      });
      return;
    }

    // If student, check if they're enrolled in the course.
    if (isStudent) {
      const courses = await CourseModel.findByStudentId(req.user.id, "active");
      const isEnrolled = courses.some((c) => c.id === course.id);

      if (!isEnrolled) {
        res.status(403).json({
          success: false,
          message: "You're not enrolled in this course",
        });
        return;
      }
    }

    const questions = await QuizModel.getQuizQuestions(itemId);

    // If student, omit the 'is_correct' field from options.
    if (isStudent) {
      questions.forEach((q) => {
        if (q.options) {
          q.options.forEach((o) => {
            delete o.is_correct;
          });
        }
      });
    }

    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    logger.error(`Error getting quiz questions: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all responses for a quiz submission.
 * @route GET /api/quizzes/submissions/:submissionId/responses
 * @access Private (students can only see their own responses, professors can see all)
 */
export const getQuizResponses = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const submissionId = parseInt(req.params.submissionId);

    // Get the submission.
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    // Get the course item to verify it's a quiz.
    const courseItem = await CourseItemModel.findById(submission.item_id);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    if (courseItem.type !== "quiz") {
      res.status(400).json({
        success: false,
        message: "This submission is not for a quiz",
      });
      return;
    }

    // Get the course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    // Check permissions.
    const isProfessor =
      req.user.role === "professor" && course.professor_id === req.user.id;

    const isStudent = req.user.role === "user";

    if (isStudent) {
      // Verify the submission belongs to the user
      const enrollments = await CourseModel.getEnrollmentsForCourse(
        courseItem.course_id
      );

      const userEnrollments = enrollments.map((e) => e.student_id);
      if (!userEnrollments.includes(req.user!.id)) {
        res.status(403).json({
          success: false,
          message: "You don't have permission to view these responses",
        });
        return;
      }
    } else if (!isProfessor) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view these responses",
      });
      return;
    }

    const responses = await QuizModel.getSubmissionResponses(submissionId);
    const questions = await QuizModel.getQuizQuestions(submission.item_id);

    res.status(200).json({
      success: true,
      data: {
        responses,
        questions,
      },
    });
  } catch (error) {
    logger.error(`Error getting quiz responses: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Calculate score for a quiz submission
 * @route POST /api/quizzes/submissions/:submissionId/score
 * @access Private (professors only)
 */
export const calculateQuizScore = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  if (req.user.role !== "professor") {
    res.status(403).json({
      success: false,
      message: "Only professors can calculate quiz scores",
    });
    return;
  }

  try {
    const submissionId = parseInt(req.params.submissionId);

    // Get the submission.
    const submission = await SubmissionModel.findById(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, message: "Submission not found" });
      return;
    }

    // Get the course item to verify it's a quiz.
    const courseItem = await CourseItemModel.findById(submission.item_id);
    if (!courseItem) {
      res
        .status(404)
        .json({ success: false, message: "Course item not found" });
      return;
    }

    if (courseItem.type !== "quiz") {
      res.status(400).json({
        success: false,
        message: "This submission is not for a quiz",
      });
      return;
    }

    // Check if professor owns the course.
    const course = await CourseModel.findById(courseItem.course_id);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    if (course.professor_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to calculate scores for this quiz",
      });
      return;
    }

    // Calculate the score.
    const score = await QuizModel.calculateScore(submissionId);

    // Update the item grade.
    // TODO: Implement grade updating.

    res.status(200).json({
      success: true,
      data: {
        submission_id: submissionId,
        score,
      },
      message: "Quiz scored successfully",
    });
  } catch (error) {
    logger.error(`Error calculating quiz score: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
