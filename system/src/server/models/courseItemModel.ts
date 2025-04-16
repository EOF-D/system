import { getDb } from "../config/database";
import {
  CourseItem,
  CreateCourseItemInput,
  UpdateCourseItemInput,
} from "../../shared/types/models/courseItem";
import { logger } from "../../shared/utils/logger";

/**
 * Handles course item-related database operations.
 */
export class CourseItemModel {
  /**
   * Create a new course item.
   * @param {CreateCourseItemInput} itemData - The data for the new course item.
   * @returns {Promise<CourseItem>} The created course item.
   */
  static async create(itemData: CreateCourseItemInput): Promise<CourseItem> {
    logger.info(`Creating course item: ${itemData}`);
    const db = await getDb();

    try {
      // Check if the course exists.
      const course = await db.get("SELECT * FROM courses WHERE id = ?", [
        itemData.course_id,
      ]);

      if (!course) {
        throw new Error("Course not found");
      }

      // Create the course item.
      const maxPoints = itemData.type === "document" ? 0 : itemData.max_points;
      const result = await db.run(
        `
        INSERT INTO course_items (
          course_id, name, type, max_points, due_date, description
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          itemData.course_id,
          itemData.name,
          itemData.type,
          maxPoints,
          itemData.due_date,
          itemData.description,
        ]
      );

      // Get the created course item.
      const item = await db.get<CourseItem>(
        "SELECT * FROM course_items WHERE id = ?",
        [result.lastID]
      );

      return item!;
    } finally {
      await db.close();
    }
  }

  /**
   * Update a course item.
   * @param {number} id - The ID of the course item to update.
   * @param {UpdateCourseItemInput} updateData - The data to update the course item with.
   * @returns {Promise<CourseItem | null>} The updated course item or null if not found.
   */
  static async update(
    id: number,
    updateData: UpdateCourseItemInput
  ): Promise<CourseItem | null> {
    logger.info(`Updating course item: ${id} data: ${updateData}`);
    const db = await getDb();

    try {
      // Check if the course item exists.
      const item = await db.get<CourseItem>(
        "SELECT * FROM course_items WHERE id = ?",
        [id]
      );

      if (!item) {
        return null;
      }

      // Build the update query.
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push("name = ?");
        values.push(updateData.name);
      }

      if (updateData.type !== undefined) {
        updateFields.push("type = ?");
        values.push(updateData.type);
      }

      if (updateData.max_points !== undefined) {
        // Set max_points to 0 for documents.
        const maxPoints =
          updateData.type === "document" ? 0 : updateData.max_points;

        updateFields.push("max_points = ?");
        values.push(maxPoints);
      }

      if (updateData.due_date !== undefined) {
        updateFields.push("due_date = ?");
        values.push(updateData.due_date);
      }

      if (updateData.description !== undefined) {
        updateFields.push("description = ?");
        values.push(updateData.description);
      }

      // If there are no fields to update, return the original item.
      if (updateFields.length === 0) {
        return item;
      }

      // Add the WHERE clause parameter.
      values.push(id);

      // Execute the update query.
      await db.run(
        `UPDATE course_items SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

      // Get the updated course item.
      const updatedItem = await db.get<CourseItem>(
        "SELECT * FROM course_items WHERE id = ?",
        [id]
      );

      return updatedItem || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Delete a course item.
   * @param {number} id - The ID of the course item to delete.
   * @returns {Promise<boolean>} True if deleted successfully, false otherwise.
   */
  static async delete(id: number): Promise<boolean> {
    logger.info(`Deleting course item: ${id}`);
    const db = await getDb();

    try {
      // Check if the course item exists.
      const item = await db.get("SELECT * FROM course_items WHERE id = ?", [
        id,
      ]);

      if (!item) {
        return false;
      }

      await db.run("BEGIN TRANSACTION");

      // Delete the course item and its associated grades.
      await db.run("DELETE FROM item_grades WHERE item_id = ?", [id]);
      const result = await db.run("DELETE FROM course_items WHERE id = ?", [
        id,
      ]);

      await db.run("COMMIT");
      return result.changes! > 0;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error deleting course item: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a course item by ID.
   * @param {number} id - The ID of the course item.
   * @returns {Promise<CourseItem | null>} The course item or null if not found.
   */
  static async findById(id: number): Promise<CourseItem | null> {
    logger.info(`Finding course item: ${id}`);
    const db = await getDb();

    try {
      const item = await db.get<CourseItem>(
        `
        SELECT * FROM course_items WHERE id = ?
        `,
        [id]
      );

      return item || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all course items for a course.
   * @param {number} courseId - The ID of the course.
   * @returns {Promise<CourseItem[]>} List of course items.
   */
  static async findByCourseId(courseId: number): Promise<CourseItem[]> {
    logger.info(`Finding course items for course: ${courseId}`);
    const db = await getDb();

    try {
      const items = await db.all<CourseItem[]>(
        `
        SELECT * FROM course_items 
        WHERE course_id = ?
        ORDER BY due_date ASC
        `,
        [courseId]
      );

      return items;
    } finally {
      await db.close();
    }
  }

  /**
   * Get upcoming course items for a student.
   * @param {number} studentId - The ID of the student.
   * @param {number} limit - Maximum number of items to return.
   * @returns {Promise<CourseItem[]>} List of upcoming course items.
   */
  static async getUpcomingForStudent(
    studentId: number,
    limit: number = 5
  ): Promise<CourseItem[]> {
    logger.info(`Finding upcoming course items for student: ${studentId}`);
    const db = await getDb();

    try {
      const items = await db.all<CourseItem[]>(
        `
        SELECT 
          ci.id,
          ci.course_id,
          ci.name,
          ci.type,
          ci.max_points,
          ci.due_date,
          ci.description,
          c.prefix,
          c.number
        FROM course_items ci
        JOIN enrollments e ON ci.course_id = e.course_id
        JOIN courses c ON ci.course_id = c.id
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
        [studentId, limit]
      );

      return items;
    } finally {
      await db.close();
    }
  }
}
