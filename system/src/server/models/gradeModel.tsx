import { getDb } from "@server/config/database";
import {
  Grade,
  GradeInput,
  GradeWithItemDetails,
  GradeWithStudentDetails,
} from "@shared/types/models/grade";
import { logger } from "@shared/utils/logger";

/**
 * Handles grade-related database operations.
 */
export class GradeModel {
  /**
   * Create or update a grade for a course item.
   * @param {GradeInput} gradeData - The data for the grade.
   * @returns {Promise<Grade>} The created or updated grade.
   */
  static async createOrUpdateGrade(gradeData: GradeInput): Promise<Grade> {
    logger.info(
      `Creating/updating grade for enrollment: ${gradeData.enrollment_id}, item: ${gradeData.item_id}, points: ${gradeData.points_earned}`
    );

    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      // Check if the enrollment exists.
      const enrollment = await db.get(
        "SELECT * FROM enrollments WHERE id = ?",
        [gradeData.enrollment_id]
      );

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      // Check if the course item exists.
      const courseItem = await db.get(
        `SELECT * FROM course_items WHERE id = ?`,
        [gradeData.item_id]
      );

      if (!courseItem) {
        throw new Error("Course item not found");
      }

      // Validate points earned (can't exceed max points).
      if (gradeData.points_earned > courseItem.max_points) {
        throw new Error(
          `Points earned cannot exceed max points (${courseItem.max_points})`
        );
      }

      // Check if a grade already exists.
      const existingGrade = await db.get<Grade>(
        `SELECT * FROM item_grades WHERE enrollment_id = ? AND item_id = ?`,
        [gradeData.enrollment_id, gradeData.item_id]
      );

      let gradeId: number;
      if (existingGrade) {
        // Update existing grade.
        await db.run(
          `UPDATE item_grades SET points_earned = ? WHERE enrollment_id = ? AND item_id = ?`,
          [gradeData.points_earned, gradeData.enrollment_id, gradeData.item_id]
        );

        gradeId = existingGrade.id;
      } else {
        // Create new grade.
        const result = await db.run(
          `INSERT INTO item_grades (enrollment_id, item_id, points_earned, submission_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [gradeData.enrollment_id, gradeData.item_id, gradeData.points_earned]
        );

        gradeId = result.lastID!;
      }
      const grade = await db.get<Grade>(
        `SELECT * FROM item_grades WHERE id = ?`,
        [gradeId]
      );

      // Update final grade in enrollment.
      await GradeModel.updateFinalGrade(
        enrollment.course_id,
        enrollment.student_id
      );

      await db.run("COMMIT");
      return grade!;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error creating/updating grade: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all grades for a specific enrollment.
   * @param {number} enrollmentId - The ID of the enrollment.
   * @returns {Promise<GradeWithItemDetails[]>} List of grades with course item details.
   */
  static async getGradesByEnrollmentId(
    enrollmentId: number
  ): Promise<GradeWithItemDetails[]> {
    logger.info(`Getting grades for enrollment: ${enrollmentId}`);
    const db = await getDb();

    try {
      const grades = await db.all<GradeWithItemDetails[]>(
        `
        SELECT 
          ig.*,
          ci.name as item_name,
          ci.type as item_type,
          ci.max_points
        FROM item_grades ig
        JOIN course_items ci ON ig.item_id = ci.id
        WHERE ig.enrollment_id = ?
        ORDER BY ci.due_date ASC
        `,
        [enrollmentId]
      );

      return grades;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a grade by ID.
   * @param {number} id - The ID of the grade.
   * @returns {Promise<Grade | null>} The grade or null if not found.
   */
  static async getGradeById(id: number): Promise<Grade | null> {
    logger.info(`Getting grade by ID: ${id}`);
    const db = await getDb();

    try {
      const grade = await db.get<Grade>(
        `SELECT * FROM item_grades WHERE id = ?`,
        [id]
      );

      return grade || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a grade by enrollment and item IDs.
   * @param {number} enrollmentId - The ID of the enrollment.
   * @param {number} itemId - The ID of the course item.
   * @returns {Promise<Grade | null>} The grade or null if not found.
   */
  static async getGradeByEnrollmentAndItemId(
    enrollmentId: number,
    itemId: number
  ): Promise<Grade | null> {
    logger.info(
      `Getting grade for enrollment: ${enrollmentId} and item: ${itemId}`
    );
    const db = await getDb();

    try {
      const grade = await db.get<Grade>(
        `SELECT * FROM item_grades WHERE enrollment_id = ? AND item_id = ?`,
        [enrollmentId, itemId]
      );

      return grade || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all grades for a course item.
   * @param {number} itemId - The ID of the course item.
   * @returns {Promise<GradeWithStudentDetails[]>} List of grades with student details.
   */
  static async getGradesByItemId(
    itemId: number
  ): Promise<GradeWithStudentDetails[]> {
    logger.info(`Getting grades for item: ${itemId}`);
    const db = await getDb();

    try {
      const grades = await db.all<GradeWithStudentDetails[]>(
        `
        SELECT 
          ig.*,
          p.first_name || ' ' || p.last_name as student_name,
          u.id as student_id
        FROM item_grades ig
        JOIN enrollments e ON ig.enrollment_id = e.id
        JOIN users u ON e.student_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        WHERE ig.item_id = ?
        ORDER BY student_name ASC
        `,
        [itemId]
      );

      return grades;
    } finally {
      await db.close();
    }
  }

  /**
   * Calculate and update the final grade for a student in a course.
   * @param {number} courseId - The ID of the course.
   * @param {number} studentId - The ID of the student.
   * @returns {Promise<string | null>} The calculated final grade or null if not enough data.
   */
  static async updateFinalGrade(
    courseId: number,
    studentId: number
  ): Promise<string | null> {
    logger.info(
      `Updating final grade for student: ${studentId} in course: ${courseId}`
    );

    const db = await getDb();

    try {
      // Find the enrollment.
      const enrollment = await db.get(
        `SELECT * FROM enrollments WHERE course_id = ? AND student_id = ? AND status = 'active'`,
        [courseId, studentId]
      );

      if (!enrollment) {
        throw new Error("Active enrollment not found");
      }

      // Get all graded items for the course.
      const courseItems = await db.all(
        `SELECT * FROM course_items WHERE course_id = ? AND type != 'document'`,
        [courseId]
      );

      if (courseItems.length === 0) {
        return null; // No gradable items in the course.
      }

      // Get all grades for the student in this course.
      const grades = await db.all(
        `
        SELECT ig.*, ci.max_points
        FROM item_grades ig
        JOIN course_items ci ON ig.item_id = ci.id
        JOIN enrollments e ON ig.enrollment_id = e.id
        WHERE e.course_id = ? AND e.student_id = ?
        `,
        [courseId, studentId]
      );

      // If no grades yet, return null.
      if (grades.length === 0) {
        return null;
      }

      // Calculate the total points and max points.
      let totalEarned = 0;
      let totalPossible = 0;

      for (const grade of grades) {
        totalEarned += grade.points_earned;
        totalPossible += grade.max_points;
      }

      // Calculate percentage.
      const percentage =
        totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

      // Convert percentage to letter grade.
      let letterGrade: string;
      if (percentage >= 93) {
        letterGrade = "A";
      } else if (percentage >= 90) {
        letterGrade = "A-";
      } else if (percentage >= 87) {
        letterGrade = "B+";
      } else if (percentage >= 83) {
        letterGrade = "B";
      } else if (percentage >= 80) {
        letterGrade = "B-";
      } else if (percentage >= 77) {
        letterGrade = "C+";
      } else if (percentage >= 73) {
        letterGrade = "C";
      } else if (percentage >= 70) {
        letterGrade = "C-";
      } else if (percentage >= 67) {
        letterGrade = "D+";
      } else if (percentage >= 63) {
        letterGrade = "D";
      } else if (percentage >= 60) {
        letterGrade = "D-";
      } else {
        letterGrade = "F";
      }

      // Update the enrollment's final grade.
      await db.run(`UPDATE enrollments SET final_grade = ? WHERE id = ?`, [
        letterGrade,
        enrollment.id,
      ]);

      return letterGrade;
    } finally {
      await db.close();
    }
  }
}
