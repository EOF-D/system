/**
 * Represents a course in the system.
 */
export interface Course {
  /**
   * The ID of the course.
   * @type {number}
   */
  id: number;

  /**
   * The professor ID of the course.
   */
  professor_id: number;

  /**
   * The name of the course.
   * @type {string}
   */
  name: string;

  /**
   * Department code (e.g., CSI, MATH).
   * @type {string}
   */
  prefix: string;

  /**
   * Course number (e.g., 101, 102).
   * @type {string}
   */
  number: string;

  /**
   * Room where the course is held.
   * @type {string}
   */
  room: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   * @type {string}
   */
  start_time: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   * @type {string}
   */
  end_time: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   * @type {string}
   */
  days: string;
}

/**
 * Extended course with professor details.
 * @extends Course
 */
export interface CourseWithProfessor extends Course {
  /**
   * The first name of the professor.
   * @type {string}
   */
  professor_first_name: string;

  /**
   * The last name of the professor.
   * @type {string}
   */
  professor_last_name: string;

  /**
   * The full name of the professor.
   * @type {string}
   */
  professor_full_name: string;

  /**
   * Section of the course (e.g., "01", "02", "03").
   * @type {string}
   */
  section: string;
}

/**
 * Extended course with enrollment count.
 * @extends Course
 */
export interface CourseWithEnrollments extends Course {
  /**
   * Number of students enrolled in the course.
   * @type {number}
   */
  enrollment_count: number;

  /**
   * Number of assignments in the course.
   * @type {number}
   */
  assignment_count: number;
}

/**
 * Represents the input data for creating a new course.
 * @extends Omit<Course, "id">
 */
export interface CreateCourseInput extends Omit<Course, "id"> {}

/**
 * Represents the input data for updating an existing course.
 * @extends Partial<Omit<Course, "id">>
 */
export interface UpdateCourseInput extends Partial<Omit<Course, "id">> {}
