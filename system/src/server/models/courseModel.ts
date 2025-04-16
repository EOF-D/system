import { getDb } from "../config/database";
import {
  Course,
  CourseWithEnrollments,
  CourseWithProfessor,
  CreateCourseInput,
  UpdateCourseInput,
} from "../../shared/types/models/course";
import { Enrollment } from "../../shared/types/models/enrollment";
import { logger } from "../../shared/utils/logger";

/**
 * Handles course-related database operations.
 */
export class CourseModel {
  /**
   * Create a new course.
   * @param {CreateCourseInput} courseData - The data for the new course.
   * @returns {Promise<Course>} The created course.
   */
  static async create(courseData: CreateCourseInput): Promise<Course> {
    logger.info(`Creating course: ${courseData}`);
    const db = await getDb();

    try {
      // Validate that the professor exists and has the professor role.
      const professor = await db.get(
        `SELECT u.id, u.role FROM users u WHERE u.id = ?`,
        [courseData.professor_id]
      );

      if (!professor) {
        throw new Error("Professor not found");
      }

      if (professor.role !== "professor") {
        throw new Error("Only users with professor role can create courses");
      }

      const result = await db.run(
        `
        INSERT INTO courses (
          professor_id, name, prefix, number, room, start_time, end_time, days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          courseData.professor_id,
          courseData.name,
          courseData.prefix,
          courseData.number,
          courseData.room,
          courseData.start_time,
          courseData.end_time,
          courseData.days,
        ]
      );

      // Get the created course.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [result.lastID]
      );

      return course!;
    } finally {
      await db.close();
    }
  }

  /**
   * Update an existing course.
   * @param {number} id - The ID of the course to update.
   * @param {UpdateCourseInput} updateData - The data to update the course with.
   * @returns {Promise<Course | null>} The updated course or null if not found.
   */
  static async update(
    id: number,
    updateData: UpdateCourseInput
  ): Promise<Course | null> {
    logger.info(`Updating course: ${id} data: ${updateData}`);
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id]
      );

      if (!course) {
        return null;
      }

      // Build the update query.
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push("name = ?");
        values.push(updateData.name);
      }

      if (updateData.prefix !== undefined) {
        updateFields.push("prefix = ?");
        values.push(updateData.prefix);
      }

      if (updateData.number !== undefined) {
        updateFields.push("number = ?");
        values.push(updateData.number);
      }

      if (updateData.room !== undefined) {
        updateFields.push("room = ?");
        values.push(updateData.room);
      }

      if (updateData.start_time !== undefined) {
        updateFields.push("start_time = ?");
        values.push(updateData.start_time);
      }

      if (updateData.end_time !== undefined) {
        updateFields.push("end_time = ?");
        values.push(updateData.end_time);
      }

      if (updateData.days !== undefined) {
        updateFields.push("days = ?");
        values.push(updateData.days);
      }

      // If there are no fields to update, return the original course.
      if (updateFields.length === 0) {
        return course;
      }

      // Add the WHERE clause parameter.
      values.push(id);

      // Execute the update query.
      await db.run(
        `UPDATE courses SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      // Get the updated course.
      const updatedCourse = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id]
      );

      return updatedCourse || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Delete a course.
   * @param {number} id - The ID of the course to delete.
   * @returns {Promise<boolean>} True if the course was deleted, false otherwise.
   */
  static async delete(id: number): Promise<boolean> {
    logger.info(`Deleting course: ${id}`);
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id]
      );

      if (!course) {
        return false;
      }

      await db.run("BEGIN TRANSACTION");

      // Delete related data.
      await db.run(
        `
        DELETE FROM item_grades
        WHERE item_id IN (
          SELECT id FROM course_items WHERE course_id = ?
        )
      `,
        [id]
      );

      await db.run(`DELETE FROM course_items WHERE course_id = ?`, [id]);
      await db.run(`DELETE FROM enrollments WHERE course_id = ?`, [id]);

      // Delete the course itself.
      const result = await db.run(`DELETE FROM courses WHERE id = ?`, [id]);

      await db.run("COMMIT");
      return result.changes! > 0;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error deleting course: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a course by ID.
   * @param {number} id - The ID of the course to retrieve.
   * @returns {Promise<Course | null>} The course or null if not found.
   */
  static async findById(id: number): Promise<Course | null> {
    logger.info(`Finding course: ${id}`);
    const db = await getDb();

    try {
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id]
      );

      return course || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all courses.
   * @returns {Promise<Course[]>} List of all courses.
   */
  static async findAll(): Promise<Course[]> {
    logger.info("Fetching all courses from the database.");
    const db = await getDb();

    try {
      const courses = await db.all<Course[]>(`
        SELECT * FROM courses
        ORDER BY prefix, number
      `);

      return courses;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all courses taught by a professor.
   * @param {number} professorId - The ID of the professor.
   * @returns {Promise<CourseWithEnrollments[]>} List of courses with enrollment counts.
   */
  static async findByProfessorId(
    professorId: number
  ): Promise<CourseWithEnrollments[]> {
    logger.info(`Fetching courses for professor: ${professorId}`);
    const db = await getDb();

    try {
      const courses = await db.all<CourseWithEnrollments[]>(
        `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as enrollment_count,
          (SELECT COUNT(*) FROM course_items ci WHERE ci.course_id = c.id) as assignment_count
        FROM courses c
        WHERE c.professor_id = ?
        ORDER BY c.prefix, c.number
      `,
        [professorId]
      );

      return courses;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all courses a student is enrolled in.
   * @param {number} studentId - The ID of the student.
   * @param {string} status - The enrollment status to filter by (default 'active').
   * @returns {Promise<CourseWithProfessor[]>} List of courses with professor details.
   */
  static async findByStudentId(
    studentId: number,
    status: "active" | "dropped" | "completed" | "pending" = "active"
  ): Promise<CourseWithProfessor[]> {
    logger.info(
      `Fetching courses for student: ${studentId} with status: ${status}`
    );

    const db = await getDb();

    try {
      const courses = await db.all<CourseWithProfessor[]>(
        `
        SELECT 
          c.*,
          e.final_grade,
          p.first_name as professor_first_name,
          p.last_name as professor_last_name,
          p.first_name || ' ' || p.last_name as professor_full_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.professor_id = u.id
        JOIN profiles p ON u.profile_id = p.id
        WHERE e.student_id = ? AND e.status = ?
        ORDER BY c.prefix, c.number
      `,
        [studentId, status]
      );

      return courses;
    } finally {
      await db.close();
    }
  }

  /**
   * Get student enrollments with current grades for a course.
   * @param {number} courseId - The ID of the course.
   * @returns {Promise<StudentEnrollment[]>} List of student enrollments with grades.
   */
  static async getEnrollmentsForCourse(
    courseId: number
  ): Promise<Enrollment[]> {
    logger.info(`Fetching enrollments for course: ${courseId}`);
    const db = await getDb();

    try {
      const enrollments = await db.all<Enrollment[]>(
        `
        SELECT 
          e.id as enrollment_id,
          e.course_id,
          e.student_id,
          e.final_grade,
          e.enrollment_date,
          e.status
        FROM enrollments e
        WHERE e.course_id = ? AND e.status = 'active'
        ORDER BY e.enrollment_date ASC
      `,
        [courseId]
      );

      return enrollments;
    } finally {
      await db.close();
    }
  }
}
