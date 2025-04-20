import {
  acceptInvitation,
  declineInvitation,
  getCourseEnrollments,
  getMyEnrollments,
  getMyInvitations,
  inviteStudent,
} from "@server/controllers/enrollmentController";
import { professorOnly, protect } from "@server/middleware/auth";
import express from "express";

export const enrollmentRouter = express.Router();

// Protected routes - require authentication.
enrollmentRouter.use(protect);

/**
 * @route GET /api/enrollments/me
 * @description Get all enrollments for the current user.
 * @access Private
 */
enrollmentRouter.get("/me", getMyEnrollments);

/**
 * @route GET /api/enrollments/invitations
 * @description Get pending invitations for the current user.
 * @access Private
 */
enrollmentRouter.get("/invitations", getMyInvitations);

/**
 * @route PUT /api/enrollments/accept/:id
 * @description Accept an invitation.
 * @access Private
 */
enrollmentRouter.put("/accept/:id", acceptInvitation);

/**
 * @route PUT /api/enrollments/decline/:id
 * @description Decline an invitation.
 * @access Private
 */
enrollmentRouter.put("/decline/:id", declineInvitation);

// Protected routes - require authentication and professor role.
enrollmentRouter.use(professorOnly);

/**
 * @route GET /api/enrollments/course/:id
 * @description Get all enrollments for a specific course (including pending invitations).
 * @access Professor (own courses only)
 */
enrollmentRouter.get("/course/:id", getCourseEnrollments);

/**
 * @route POST /api/enrollments/invite
 * @desc Send an invitation to a student for a course.
 * @access Professor
 */
enrollmentRouter.post("/invite", inviteStudent);
