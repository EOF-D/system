import {
  CreateSubmissionInput,
  Submission,
  SubmissionWithDetails,
  UpdateSubmissionInput,
} from "../../shared/types/models/submission";
import { getDb } from "../config/database";
import { logger } from "../utils/logger";

/**
 * Handles submission-related database operations.
 */
export class SubmissionModel {
  /**
   * Create a new submission.
   * @param {CreateSubmissionInput} submissionData - The data for the new submission.
   * @returns {Promise<Submission>} The created submission.
   */
  static async create(
    submissionData: CreateSubmissionInput
  ): Promise<Submission> {
    logger.info(`Creating submission: ${submissionData}`);
    const db = await getDb();

    try {
      // Check if the enrollment and course item exist.
      const enrollment = await db.get(
        "SELECT * FROM enrollments WHERE id = ?",
        [submissionData.enrollment_id]
      );

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      const courseItem = await db.get(
        "SELECT * FROM course_items WHERE id = ?",
        [submissionData.item_id]
      );

      if (!courseItem) {
        throw new Error("Course item not found");
      }

      // Ensure the item is an assignment or quiz.
      if (courseItem.type !== "assignment" && courseItem.type !== "quiz") {
        throw new Error(
          "Submissions are only allowed for assignments and quizzes"
        );
      }

      // Check if a submission already exists.
      const existingSubmission = await db.get(
        "SELECT * FROM submissions WHERE enrollment_id = ? AND item_id = ?",
        [submissionData.enrollment_id, submissionData.item_id]
      );

      if (existingSubmission) {
        throw new Error("Submission already exists for this item");
      }

      // Create a new submission.
      const status = submissionData.status || "submitted";
      const result = await db.run(
        `
        INSERT INTO submissions (
          enrollment_id, item_id, content, status, submission_date
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          submissionData.enrollment_id,
          submissionData.item_id,
          submissionData.content || null,
          status,
        ]
      );

      // Get the created submission.
      const submission = await db.get<Submission>(
        "SELECT * FROM submissions WHERE id = ?",
        [result.lastID]
      );

      return submission!;
    } finally {
      await db.close();
    }
  }

  /**
   * Update a submission.
   * @param {number} id - The ID of the submission to update.
   * @param {UpdateSubmissionInput} updateData - The data to update the submission with.
   * @returns {Promise<Submission | null>} The updated submission or null if not found.
   */
  static async update(
    id: number,
    updateData: UpdateSubmissionInput
  ): Promise<Submission | null> {
    logger.info(`Updating submission: ${updateData}`);
    const db = await getDb();

    try {
      // Check if the submission exists.
      const submission = await db.get<Submission>(
        "SELECT * FROM submissions WHERE id = ?",
        [id]
      );

      if (!submission) {
        return null;
      }

      const { content, status } = updateData;
      const updateValues: any[] = [];
      const updateFields: string[] = [];

      if (content !== undefined) {
        updateFields.push("content = ?");
        updateValues.push(content);
      }

      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      // If nothing to update, return the original submission.
      if (updateFields.length === 0) {
        return submission;
      }

      // Add submission date if the status is changing to submitted.
      if (status === "submitted" && submission.status !== "submitted") {
        updateFields.push("submission_date = CURRENT_TIMESTAMP");
      }

      // Add the WHERE clause parameter.
      updateValues.push(id);

      // Execute the update query.
      await db.run(
        `UPDATE submissions SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );

      // Get the updated submission.
      const updatedSubmission = await db.get<Submission>(
        "SELECT * FROM submissions WHERE id = ?",
        [id]
      );

      return updatedSubmission || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Delete a submission.
   * @param {number} id - The ID of the submission to delete.
   * @returns {Promise<boolean>} True if the submission was deleted, false otherwise.
   */
  static async delete(id: number): Promise<boolean> {
    logger.info(`Deleting submission: ${id}`);
    const db = await getDb();

    try {
      const result = await db.run("DELETE FROM submissions WHERE id = ?", [id]);
      return result.changes! > 0;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a submission by ID.
   * @param {number} id - The ID of the submission.
   * @returns {Promise<SubmissionWithDetails | null>} The submission with details or null if not found.
   */
  static async findById(id: number): Promise<SubmissionWithDetails | null> {
    logger.info(`Finding submission: ${id}`);
    const db = await getDb();

    try {
      const submission = await db.get<SubmissionWithDetails>(
        `
        SELECT 
          s.*,
          ci.name as item_name,
          ci.type as item_type,
          ci.max_points,
          ci.due_date,
          p.first_name || ' ' || p.last_name as student_full_name,
          ig.points_earned
        FROM submissions s
        JOIN course_items ci ON s.item_id = ci.id
        JOIN enrollments e ON s.enrollment_id = e.id
        JOIN users u ON e.student_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        LEFT JOIN item_grades ig ON ig.enrollment_id = s.enrollment_id AND ig.item_id = s.item_id
        WHERE s.id = ?
        `,
        [id]
      );

      return submission || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get submissions for a student.
   * @param {number} studentId - The ID of the student.
   * @param {number} courseId - Optional course ID to filter by.
   * @returns {Promise<SubmissionWithDetails[]>} List of submissions.
   */
  static async findByStudentId(
    studentId: number,
    courseId?: number
  ): Promise<SubmissionWithDetails[]> {
    logger.info(
      `Finding submissions for student: ${studentId} course: ${courseId}`
    );

    const db = await getDb();

    try {
      let query = `
        SELECT 
          s.*,
          ci.name as item_name,
          ci.type as item_type,
          ci.max_points,
          ci.due_date,
          ig.points_earned
        FROM submissions s
        JOIN course_items ci ON s.item_id = ci.id
        JOIN enrollments e ON s.enrollment_id = e.id
        LEFT JOIN item_grades ig ON ig.enrollment_id = s.enrollment_id AND ig.item_id = s.item_id
        WHERE e.student_id = ?
      `;

      const params = [studentId];
      if (courseId) {
        query += " AND ci.course_id = ?";
        params.push(courseId);
      }

      query += " ORDER BY s.submission_date DESC";
      const submissions = await db.all<SubmissionWithDetails[]>(query, params);

      return submissions;
    } finally {
      await db.close();
    }
  }

  /**
   * Get submissions for a course item.
   * @param {number} itemId - The ID of the course item.
   * @returns {Promise<SubmissionWithDetails[]>} List of submissions.
   */
  static async findByItemId(itemId: number): Promise<SubmissionWithDetails[]> {
    logger.info(`Finding submissions for item: ${itemId}`);
    const db = await getDb();

    try {
      const submissions = await db.all<SubmissionWithDetails[]>(
        `
        SELECT 
          s.*,
          ci.name as item_name,
          ci.type as item_type,
          ci.max_points,
          ci.due_date,
          p.first_name || ' ' || p.last_name as student_full_name,
          ig.points_earned
        FROM submissions s
        JOIN course_items ci ON s.item_id = ci.id
        JOIN enrollments e ON s.enrollment_id = e.id
        JOIN users u ON e.student_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        LEFT JOIN item_grades ig ON ig.enrollment_id = s.enrollment_id AND ig.item_id = s.item_id
        WHERE s.item_id = ?
        ORDER BY s.submission_date DESC
        `,
        [itemId]
      );

      return submissions;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a submission by enrollment ID and item ID.
   * @param {number} enrollmentId - The ID of the enrollment.
   * @param {number} itemId - The ID of the course item.
   * @returns {Promise<Submission | null>} The submission or null if not found.
   */
  static async findByEnrollmentAndItemId(
    enrollmentId: number,
    itemId: number
  ): Promise<Submission | null> {
    logger.info(
      `Finding submission by enrollment: ${enrollmentId} and item: ${itemId}`
    );

    const db = await getDb();

    try {
      const submission = await db.get<Submission>(
        "SELECT * FROM submissions WHERE enrollment_id = ? AND item_id = ?",
        [enrollmentId, itemId]
      );

      return submission || null;
    } finally {
      await db.close();
    }
  }
}
