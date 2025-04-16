import { getDb } from "../config/database";
import {
  CreateEnrollmentInput,
  Enrollment,
  EnrollmentWithCourseDetails,
  EnrollmentWithStudentDetails,
  UpdateEnrollmentStatusInput,
} from "../types/models/enrollment";
import { logger } from "../utils/logger";

/**
 * Handles enrollment-related database operations.
 */
export class EnrollmentModel {
  /**
   * Create a new enrollment in the database.
   * @param {CreateEnrollmentInput} enrollmentData - The data for the new enrollment.
   * @returns {Promise<Enrollment>} The created enrollment.
   */
  static async create(
    enrollmentData: CreateEnrollmentInput
  ): Promise<Enrollment> {
    logger.info(`Creating a new enrollment: ${enrollmentData}`);
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get(`SELECT * FROM courses WHERE id = ?`, [
        enrollmentData.course_id,
      ]);

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if the student exists.
      const student = await db.get(`SELECT * FROM users WHERE id = ?`, [
        enrollmentData.student_id,
      ]);

      if (!student) {
        throw new Error("Student not found");
      }

      // Check if the student is already enrolled in the course.
      const existingEnrollment = await db.get(
        `SELECT * FROM enrollments 
         WHERE course_id = ? AND student_id = ?`,
        [enrollmentData.course_id, enrollmentData.student_id]
      );

      if (existingEnrollment) {
        throw new Error("Student is already enrolled in this course");
      }

      // Default status is 'active' unless specified.
      const status = enrollmentData.status || "active";

      // Create the enrollment.
      const result = await db.run(
        `INSERT INTO enrollments (
          course_id, student_id, status, enrollment_date
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [enrollmentData.course_id, enrollmentData.student_id, status]
      );

      // Get the created enrollment.
      const enrollment = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ?`,
        [result.lastID]
      );

      return enrollment!;
    } finally {
      await db.close();
    }
  }

  /**
   * Update enrollment status.
   * @param {number} enrollmentId - The ID of the enrollment to update.
   * @param {UpdateEnrollmentStatusInput} updateData - The new status data.
   * @returns {Promise<Enrollment | null>} The updated enrollment or null if not found.
   */
  static async updateStatus(
    enrollmentId: number,
    updateData: UpdateEnrollmentStatusInput
  ): Promise<Enrollment | null> {
    logger.info(`Updating enrollment status: ${updateData}`);
    const db = await getDb();

    try {
      // Check if the enrollment exists.
      const enrollment = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ?`,
        [enrollmentId]
      );

      if (!enrollment) {
        return null;
      }

      // Update the status.
      await db.run(`UPDATE enrollments SET status = ? WHERE id = ?`, [
        updateData.status,
        enrollmentId,
      ]);

      // Get the updated enrollment.
      const updatedEnrollment = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ?`,
        [enrollmentId]
      );

      return updatedEnrollment || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Delete an enrollment.
   * @param {number} enrollmentId - The ID of the enrollment to delete.
   * @returns {Promise<boolean>} True if deleted successfully.
   */
  static async delete(enrollmentId: number): Promise<boolean> {
    logger.info(`Deleting enrollment: ${enrollmentId}`);
    const db = await getDb();

    try {
      const result = await db.run(`DELETE FROM enrollments WHERE id = ?`, [
        enrollmentId,
      ]);

      return result.changes! > 0;
    } finally {
      await db.close();
    }
  }

  /**
   * Invite a student to a course by email.
   * @param {number} courseId - The ID of the course.
   * @param {string} email - The email of the student to invite.
   * @param {number} professorId - The ID of the professor sending the invitation.
   * @returns {Promise<Enrollment | null>} The created enrollment or null if student not found.
   */
  static async inviteByEmail(
    courseId: number,
    email: string,
    professorId: number
  ): Promise<Enrollment | null> {
    logger.info(`Inviting student by email: ${email}`);
    const db = await getDb();

    try {
      // Check if the course exists and belongs to the professor.
      const course = await db.get(
        `SELECT * FROM courses WHERE id = ? AND professor_id = ?`,
        [courseId, professorId]
      );

      if (!course) {
        throw new Error(
          "Course not found or you don't have permission to invite to this course"
        );
      }

      // Find student by email.
      const student = await db.get(`SELECT id FROM users WHERE email = ?`, [
        email,
      ]);

      if (!student) {
        throw new Error("No user found with this email address");
      }

      // Check if the student is already enrolled.
      const existingEnrollment = await db.get(
        `SELECT * FROM enrollments 
         WHERE course_id = ? AND student_id = ?`,
        [courseId, student.id]
      );

      if (existingEnrollment) {
        if (existingEnrollment.status === "pending") {
          throw new Error(
            "Student already has a pending invitation to this course"
          );
        } else {
          throw new Error("Student is already enrolled in this course");
        }
      }

      // Create enrollment with "pending" status.
      const result = await db.run(
        `INSERT INTO enrollments (
          course_id, student_id, status, enrollment_date
        ) VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [courseId, student.id]
      );

      // Get the created enrollment.
      const enrollment = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ?`,
        [result.lastID]
      );

      return enrollment!;
    } catch (error) {
      logger.error(`Error inviting by email: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Get pending invitations for a student.
   * @param {number} studentId - The ID of the student.
   * @returns {Promise<EnrollmentWithCourseDetails[]>} List of pending invitations with course details.
   */
  static async getPendingInvitationsForStudent(
    studentId: number
  ): Promise<EnrollmentWithCourseDetails[]> {
    logger.info(`Getting pending invitations for student: ${studentId}`);
    const db = await getDb();

    try {
      const invitations = await db.all<EnrollmentWithCourseDetails[]>(
        `SELECT 
          e.*,
          c.name as course_name,
          c.prefix as course_prefix,
          c.number as course_number,
          p.first_name || ' ' || p.last_name as professor_full_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.professor_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        WHERE e.student_id = ? AND e.status = 'pending'
        ORDER BY e.enrollment_date DESC`,
        [studentId]
      );

      return invitations;
    } finally {
      await db.close();
    }
  }

  /**
   * Accept an invitation.
   * @param {number} invitationId - The ID of the invitation/enrollment to accept.
   * @param {number} studentId - The ID of the student accepting the invitation.
   * @returns {Promise<Enrollment>} The updated enrollment.
   */
  static async acceptInvitation(
    invitationId: number,
    studentId: number
  ): Promise<Enrollment> {
    logger.info(
      `Accepting invitation: ${invitationId} for student: ${studentId}`
    );

    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      // Get the invitation.
      const invitation = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ? AND status = 'pending'`,
        [invitationId]
      );

      if (!invitation) {
        throw new Error("Invitation not found or already processed");
      }

      // Verify the invitation is for this student>
      if (invitation.student_id !== studentId) {
        throw new Error("This invitation is not for your account");
      }

      // Update the invitation status.
      await db.run(`UPDATE enrollments SET status = 'active' WHERE id = ?`, [
        invitationId,
      ]);

      // Get the updated enrollment.
      const updatedEnrollment = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ?`,
        [invitationId]
      );

      await db.run("COMMIT");
      return updatedEnrollment!;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error accepting invitation: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Decline an invitation.
   * @param {number} invitationId - The ID of the invitation/enrollment to decline.
   * @param {number} studentId - The ID of the student declining the invitation.
   * @returns {Promise<boolean>} True if declined successfully.
   */
  static async declineInvitation(
    invitationId: number,
    studentId: number
  ): Promise<boolean> {
    logger.info(
      `Declining invitation: ${invitationId} for student: ${studentId}`
    );

    const db = await getDb();

    try {
      // Get the invitation.
      const invitation = await db.get<Enrollment>(
        `SELECT * FROM enrollments WHERE id = ? AND status = 'pending'`,
        [invitationId]
      );

      if (!invitation) {
        throw new Error("Invitation not found or already processed");
      }

      // Verify the invitation is for this student.
      if (invitation.student_id !== studentId) {
        throw new Error("This invitation is not for your account");
      }

      // Delete the invitation.
      const result = await db.run(`DELETE FROM enrollments WHERE id = ?`, [
        invitationId,
      ]);

      return result.changes! > 0;
    } finally {
      await db.close();
    }
  }

  /**
   * Get enrollments for a course.
   * @param {number} courseId - The ID of the course.
   * @param {string} status - Filter by status (optional).
   * @returns {Promise<EnrollmentWithStudentDetails[]>} List of enrollments with student details.
   */
  static async getByCourseId(
    courseId: number,
    status?: "pending" | "active" | "dropped" | "completed"
  ): Promise<EnrollmentWithStudentDetails[]> {
    logger.info(
      `Getting enrollments for course: ${courseId} status: ${status}`
    );

    const db = await getDb();

    try {
      let query = `
        SELECT 
          e.*,
          p.first_name as student_first_name,
          p.last_name as student_last_name,
          p.first_name || ' ' || p.last_name as student_full_name,
          u.email as student_email
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        WHERE e.course_id = ?
      `;

      const params: any[] = [courseId];

      if (status) {
        query += " AND e.status = ?";
        params.push(status);
      }

      query += " ORDER BY e.enrollment_date DESC";
      const enrollments = await db.all<EnrollmentWithStudentDetails[]>(
        query,
        params
      );

      return enrollments;
    } finally {
      await db.close();
    }
  }

  /**
   * Get enrollments for a student.
   * @param {number} studentId - The ID of the student.
   * @param {string} status - Filter by status (optional).
   * @returns {Promise<EnrollmentWithCourseDetails[]>} List of enrollments with course details.
   */
  static async getByStudentId(
    studentId: number,
    status?: "pending" | "active" | "dropped" | "completed"
  ): Promise<EnrollmentWithCourseDetails[]> {
    logger.info(
      `Getting enrollments for student: ${studentId} status: ${status}`
    );

    const db = await getDb();

    try {
      let query = `
        SELECT 
          e.*,
          c.name as course_name,
          c.prefix as course_prefix,
          c.number as course_number,
          p.first_name || ' ' || p.last_name as professor_full_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.professor_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        WHERE e.student_id = ?
      `;

      const params: any[] = [studentId];

      if (status) {
        query += " AND e.status = ?";
        params.push(status);
      }

      query += " ORDER BY e.enrollment_date DESC";
      const enrollments = await db.all<EnrollmentWithCourseDetails[]>(
        query,
        params
      );

      return enrollments;
    } finally {
      await db.close();
    }
  }
}
