/**
 * Represents a user enrollment in a course.
 */
export interface Enrollment {
  /**
   * The ID of the enrollment.
   * @type {number}
   */
  id: number;

  /**
   * The course ID of the enrollment.
   * @type {number}
   */
  course_id: number;

  /**
   * The student ID of the enrollment.
   * @type {number}
   */
  student_id: number;

  /**
   * The section of the course. (e.g., "01", "02", "03")
   * @type {string}
   */
  section: string;

  /**
   * The final grade (if course is completed).
   * @type {string | undefined}
   */
  final_grade?: string;

  /**
   * The enrollment status.
   * @type {string}
   */
  status: "active" | "dropped" | "completed" | "pending";

  /**
   * The enrollment date.
   * @type {string}
   */
  enrollment_date: string;
}

/**
 * Extended enrollment with course details.
 * @extends Enrollment
 */
export interface EnrollmentWithCourseDetails extends Enrollment {
  /**
   * The name of the course.
   * @type {string}
   */
  course_name: string;

  /**
   * The department prefix of the course.
   * @type {string}
   */
  course_prefix: string;

  /**
   * The course number.
   * @type {string}
   */
  course_number: string;

  /**
   * The professor's full name.
   * @type {string}
   */
  professor_full_name: string;
}

/**
 * Extended enrollment with student details.
 * @extends Enrollment
 */
export interface EnrollmentWithStudentDetails extends Enrollment {
  /**
   * The student's first name.
   * @type {string | undefined}
   */
  student_first_name?: string;

  /**
   * The student's last name.
   * @type {string | undefined}
   */
  student_last_name?: string;

  /**
   * The student's full name.
   * @type {string | undefined}
   */
  student_full_name?: string;

  /**
   * The student's email.
   * @type {string}
   */
  student_email: string;

  /**
   * The section of the course. (e.g., "01", "02", "03")
   * @type {string}
   */
  section: string;
}

/**
 * Represents the input data for creating a new enrollment.
 */
export interface CreateEnrollmentInput {
  /**
   * The ID of the course.
   * @type {number}
   */
  course_id: number;

  /**
   * The ID of the student.
   * @type {number}
   */
  student_id: number;

  /**
   * The section of the course. (e.g., "01", "02", "03")
   * @type {string}
   */
  section: string;

  /**
   * The enrollment status.
   * @type {string | undefined}
   */
  status?: "active" | "dropped" | "completed" | "pending";
}

/**
 * Represents the input data for updating an enrollment status.
 */
export interface UpdateEnrollmentStatusInput {
  /**
   * The new status of the enrollment.
   * @type {string}
   */
  status: "active" | "dropped" | "completed" | "pending";
}
