import express from "express";
import {
  inviteStudent,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
  getCourseEnrollments,
  getMyEnrollments,
} from "../controllers/enrollmentController";
import { protect } from "../middleware/authMiddleware";

// This is the enrollment router for the server.
const enrollmentRouter = express.Router();

// Protected routes - require authentication.
enrollmentRouter.use(protect);

/**
 * @route   GET /api/enrollments/my
 * @desc    Get all enrollments for the current user.
 * @access  Private
 */
enrollmentRouter.get("/my", getMyEnrollments);

/**
 * @route   GET /api/enrollments/invitations
 * @desc    Get pending invitations for the current user.
 * @access  Private
 */
enrollmentRouter.get("/invitations", getMyInvitations);

/**
 * @route   PUT /api/enrollments/accept/:id
 * @desc    Accept an invitation.
 * @access  Private
 */
enrollmentRouter.put("/accept/:id", acceptInvitation);

/**
 * @route   PUT /api/enrollments/decline/:id
 * @desc    Decline an invitation.
 * @access  Private
 */
enrollmentRouter.put("/decline/:id", declineInvitation);

/**
 * @route   GET /api/enrollments/course/:id
 * @desc    Get all enrollments for a specific course (including pending invitations).
 * @access  Professor (own courses only)
 */
enrollmentRouter.get("/course/:id", getCourseEnrollments);

/**
 * @route   POST /api/enrollments/invite
 * @desc    Send an invitation to a student for a course.
 * @access  Professor
 */
enrollmentRouter.post("/invite", inviteStudent);

export default enrollmentRouter;
