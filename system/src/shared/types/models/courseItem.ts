/**
 * Represents a course item in the system.
 */
export interface CourseItem {
  /**
   * The ID of the course item.
   * @type {number}
   */
  id: number;

  /**
   * The ID of the course this item belongs to.
   * @type {number}
   */
  course_id: number;

  /**
   * The name of the item.
   * @type {string}
   */
  name: string;

  /**
   * The type of the item (assignment, quiz, document).
   * @type {"assignment" | "quiz" | "document"}
   */
  type: "assignment" | "quiz" | "document";

  /**
   * The maximum points possible for this item.
   * @type {number}
   */
  max_points: number;

  /**
   * The due date for this item.
   * @type {string}
   */
  due_date: string;

  /**
   * Description of the item.
   * @type {string}
   */
  description: string;
}

/**
 * Represents the input data for creating a new course item.
 * @extends Omit<CourseItem, "id">
 */
export interface CreateCourseItemInput extends Omit<CourseItem, "id"> {}

/**
 * Represents the input data for updating an existing course item.
 * @extends Partial<Omit<CourseItem, "id" | "course_id">>
 */
export interface UpdateCourseItemInput
  extends Partial<Omit<CourseItem, "id" | "course_id">> {}
