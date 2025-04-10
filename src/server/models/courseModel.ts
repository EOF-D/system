import { getDb } from "../config/database";

/**
 * Course data interface.
 */
export interface Course {
  /**
   * The ID of the course.
   */
  id: number;

  /**
   * The ID of the professor teaching the course.
   */
  professor_id: number;

  /**
   * The name of the course.
   */
  name?: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number: string;

  /**
   * Room where the course is held.
   */
  room: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days: string;

  /**
   * The creation date of the course.
   */
  created_at?: string;

  /**
   * The last update date of the course.
   */
  updated_at?: string;
}

/**
 * Extended course with professor details (for students).
 */
export interface CourseWithProfessor extends Course {
  /**
   * The first name of the professor.
   */
  professor_first_name: string;

  /**
   * The last name of the professor.
   */
  professor_last_name: string;

  /**
   * The full name of the professor.
   */
  professor_full_name: string;
}

/**
 * Extended course with enrollment count (for professors)
 */
export interface CourseWithEnrollments extends Course {
  /**
   * Number of students enrolled in the course.
   */
  enrollment_count: number;

  /**
   * Number of assignments in the course.
   */
  assignment_count: number;
}

/**
 * Input data for creating a new course.
 */
export interface CreateCourseInput {
  /**
   * The ID of the professor teaching the course.
   */
  professor_id: number;

  /**
   * The name of the course.
   */
  name: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number: string;

  /**
   * Room where the course is held.
   */
  room: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days: string;
}

/**
 * Input data for updating an existing course.
 */
export interface UpdateCourseInput {
  /**
   * The name of the course.
   */
  name?: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix?: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number?: string;

  /**
   * Room where the course is held.
   */
  room?: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time?: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time?: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days?: string;
}

/**
 * Upcoming course item interface.
 */
export interface UpcomingCourseItem {
  /**
   * The ID of the item.
   */
  id: number;

  /**
   * The type of the item.
   */
  type: "assignment" | "quiz";

  /**
   * The name of the item.
   */
  name: string;

  /**
   * The due date of the item.
   */
  due_date: string;

  /**
   * The maximum points for the item.
   */
  max_points: number;
}

/**
 * Student enrollment with current grade.
 */
export interface StudentEnrollment {
  /**
   * The ID of the enrollment.
   */
  enrollment_id: number;

  /**
   * The ID of the course.
   */
  course_id: number;

  /**
   * The ID of the student.
   */
  student_id: number;

  /**
   * The current calculated grade.
   */
  current_grade?: string;

  /**
   * The final grade (if course is completed).
   */
  final_grade?: string;

  /**
   * The enrollment status.
   */
  status: "active" | "dropped" | "completed";

  /**
   * The enrollment date.
   */
  enrollment_date: string;

  /**
   * List of upcoming course items for this enrollment.
   */
  upcoming_items?: UpcomingCourseItem[];
}

/**
 * Course model for database operations.
 */
export class CourseModel {
  /**
   * Get a course by ID.
   * @param {number} id - The ID of the course to retrieve.
   * @returns {Promise<Course | null>} The course or null if not found.
   */
  static async findById(id: number): Promise<Course | null> {
    const db = await getDb();

    try {
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id],
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
    professorId: number,
  ): Promise<CourseWithEnrollments[]> {
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
        [professorId],
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
    status: "active" | "dropped" | "completed" = "active",
  ): Promise<CourseWithProfessor[]> {
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
        [studentId, status],
      );

      return courses;
    } finally {
      await db.close();
    }
  }

  /**
   * Get upcoming course items for a student.
   * @param {number} studentId - The ID of the student.
   * @param {number} limit - Maximum number of items to return.
   * @return {Promise<UpcomingCourseItem[]>} List of upcoming course items.
   */
  static async getUpcomingItemsForStudent(
    studentId: number,
    limit: number = 5,
  ): Promise<UpcomingCourseItem[]> {
    const db = await getDb();

    try {
      const items = await db.all<UpcomingCourseItem[]>(
        `
        SELECT 
          ci.id,
          ci.course_id,
          ci.name,
          ci.type,
          ci.due_date,
          ci.max_points
        FROM course_items ci
        JOIN enrollments e ON ci.course_id = e.course_id
        WHERE e.student_id = ? 
          AND e.status = 'active'
          AND ci.due_date > CURRENT_TIMESTAMP
          AND NOT EXISTS (
            SELECT 1 FROM item_grades ig 
            WHERE ig.item_id = ci.id AND ig.enrollment_id = e.id
          )
        ORDER BY ci.due_date ASC
        LIMIT ?
      `,
        [studentId, limit],
      );

      return items;
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
    courseId: number,
  ): Promise<StudentEnrollment[]> {
    const db = await getDb();

    try {
      const enrollments = await db.all<StudentEnrollment[]>(
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
        [courseId],
      );

      return enrollments.map((enrollment) => {
        return {
          ...enrollment,
          current_grade: "PLACEHOLDER", // TODO: Implement grade calculation when course ends.
        };
      });
    } finally {
      await db.close();
    }
  }

  /**
   * Create a new course.
   * @param {CreateCourseInput} courseData - The data for the new course.
   * @returns {Promise<Course>} The created course.
   */
  static async create(courseData: CreateCourseInput): Promise<Course> {
    const db = await getDb();

    try {
      // Validate that the professor exists and has the professor role.
      const professor = await db.get(
        `SELECT u.id, u.role FROM users u WHERE u.id = ?`,
        [courseData.professor_id],
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
        ],
      );

      const id = result.lastID;

      // Get the created course.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id],
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
    updateData: UpdateCourseInput,
  ): Promise<Course | null> {
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id],
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
        values,
      );

      // Get the updated course.
      const updatedCourse = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id],
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
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get<Course>(
        `SELECT * FROM courses WHERE id = ?`,
        [id],
      );
      if (!course) {
        return false;
      }

      // Delete all related records.
      await db.run("BEGIN TRANSACTION");

      // Delete item grades for this course.
      await db.run(
        `
        DELETE FROM item_grades
        WHERE item_id IN (
          SELECT id FROM course_items WHERE course_id = ?
        )
      `,
        [id],
      );

      // Delete course items.
      await db.run(`DELETE FROM course_items WHERE course_id = ?`, [id]);

      // Delete enrollments.
      await db.run(`DELETE FROM enrollments WHERE course_id = ?`, [id]);

      // Delete the course.
      const result = await db.run(`DELETE FROM courses WHERE id = ?`, [id]);

      await db.run("COMMIT");

      return result.changes! > 0;
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    } finally {
      await db.close();
    }
  }
}
