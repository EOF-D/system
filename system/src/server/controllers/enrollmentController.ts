import { Request, Response } from "express";
import { CourseModel } from "../models/courseModel";
import { EnrollmentModel } from "../models/enrollmentModel";
import { logger } from "../../shared/utils/logger";

/**
 * Invite a student to a course.
 * @route POST /api/enrollments/invite
 * @access Professor
 */
export const inviteStudent = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const { course_id, student_email, section = "01" } = req.body;
    if (!course_id || !student_email) {
      res.status(400).json({
        success: false,
        message: "Course ID and student email are required",
      });

      return;
    }

    // Get the enrollment.
    const enrollment = await EnrollmentModel.inviteByEmail(
      course_id,
      student_email,
      req.user.id,
      section
    );

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "Failed to send invitation",
      });

      return;
    }

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: enrollment,
    });

    return;
  } catch (error: any) {
    logger.error(`Error inviting student: ${error}`);
    if (
      error.message.includes("No user found") ||
      error.message.includes("already enrolled") ||
      error.message.includes("pending invitation") ||
      error.message.includes("Course not found")
    ) {
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
 * Accept an invitation.
 * @route PUT /api/enrollments/accept/:id
 * @access Private
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const enrollmentId = parseInt(req.params.id);

    await EnrollmentModel.acceptInvitation(enrollmentId, req.user.id);
    res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
    });

    return;
  } catch (error: any) {
    logger.error(`Error accepting invitation: ${error}`);
    if (
      error.message === "Invitation not found or already processed" ||
      error.message === "This invitation is not for your account"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Decline an invitation.
 * @route PUT /api/enrollments/decline/:id
 * @access Private
 */
export const declineInvitation = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const enrollmentId = parseInt(req.params.id);

    await EnrollmentModel.declineInvitation(enrollmentId, req.user.id);
    res.status(200).json({
      success: true,
      message: "Invitation declined successfully",
    });

    return;
  } catch (error: any) {
    logger.error(`Error declining invitation: ${error}`);
    if (
      error.message === "Invitation not found or already processed" ||
      error.message === "This invitation is not for your account"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });

      return;
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all enrollments for a student.
 * @route GET /api/enrollments/me
 * @access Private
 */
export const getMyEnrollments = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const status =
      (req.query.status as "active" | "dropped" | "completed" | "pending") ||
      "active";

    const enrollments = await EnrollmentModel.getByStudentId(
      req.user.id,
      status
    );

    res.status(200).json({ success: true, data: enrollments });
    return;
  } catch (error) {
    logger.error(`Error getting enrollments: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
    return;
  }
};

/**
 * Get pending invitations for the current user.
 * @route GET /api/enrollments/invitations
 * @access Private
 */
export const getMyInvitations = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const invitations = await EnrollmentModel.getPendingInvitationsForStudent(
      req.user.id
    );

    res.status(200).json({ success: true, data: invitations });
    return;
  } catch (error) {
    logger.error(`Error getting invitations: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
    return;
  }
};

/**
 * Get students enrolled in a course.
 * @route GET /api/enrollments/course/:id
 * @access Professor (own course only)
 */
export const getCourseEnrollments = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const courseId = parseInt(req.params.id);
    const status = req.query.status as
      | "active"
      | "dropped"
      | "completed"
      | "pending"
      | undefined;

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
        message: "Not authorized to view this course's enrollments",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: await EnrollmentModel.getByCourseId(courseId, status),
    });
  } catch (error) {
    logger.error(`Error getting course enrollments: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
