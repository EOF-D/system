/**
 * Represents a grade for a course item in the system.
 */
export interface Grade {
  /**
   * The ID of the grade.
   * @type {number}
   */
  id: number;

  /**
   * The ID of the enrollment.
   * @type {number}
   */
  enrollment_id: number;

  /**
   * The ID of the course item.
   * @type {number}
   */
  item_id: number;

  /**
   * The points earned for this item.
   * @type {number}
   */
  points_earned: number;

  /**
   * The date the grade was submitted.
   * @type {string | null}
   */
  submission_date: string | null;
}

/**
 * Represents a grade with detailed information about the course item.
 * @extends Grade
 */
export interface GradeWithItemDetails extends Grade {
  /**
   * The name of the course item.
   * @type {string}
   */
  item_name: string;

  /**
   * The type of the course item.
   * @type {"assignment" | "quiz" | "document"}
   */
  item_type: string;

  /**
   * The maximum points possible for this item.
   * @type {number}
   */
  max_points: number;
}

/**
 * Represents a grade with detailed information about the student.
 * @extends Grade
 */
export interface GradeWithStudentDetails extends Grade {
  /**
   * The name of the student.
   * @type {string}
   */
  student_name: string;

  /**
   * The ID of the student.
   * @type {number}
   */
  student_id: number;
}

/**
 * Represents the input data for creating or updating a grade.
 */
export interface GradeInput {
  /**
   * The ID of the enrollment.
   * @type {number}
   */
  enrollment_id: number;

  /**
   * The ID of the course item.
   * @type {number}
   */
  item_id: number;

  /**
   * The points earned for this item.
   * @type {number}
   */
  points_earned: number;
}
