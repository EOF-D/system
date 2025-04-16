/**
 * Represents a submission made by a student for a course item.
 */
export interface Submission {
  /**
   * The ID of the submission.
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
   * The content of the submission (for assignments).
   * @type {string | undefined}
   */
  content?: string;

  /**
   * The date the submission was made.
   * @type {string}
   */
  submission_date: string;

  /**
   * The status of the submission.
   * @type {"draft" | "submitted" | "graded"}
   */
  status: "draft" | "submitted" | "graded";
}

/**
 * Extended submission with course and student details.
 * @extends Submission
 */
export interface SubmissionWithDetails extends Submission {
  /**
   * The name of the course item.
   * @type {string}
   */
  item_name: string;

  /**
   * The type of the course item.
   * @type {"assignment" | "quiz"}
   */
  item_type: "assignment" | "quiz";

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
   * The student's full name.
   * @type {string | undefined}
   */
  student_full_name?: string;

  /**
   * The points earned on this submission.
   * @type {number | undefined}
   */
  points_earned?: number;
}

/**
 * Represents the input data for creating a new submission.
 */
export interface CreateSubmissionInput {
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
   * The content of the submission (for assignments).
   * @type {string | undefined}
   */
  content?: string;

  /**
   * The status of the submission.
   * @type {"draft" | "submitted"}
   */
  status?: "draft" | "submitted";
}

/**
 * Represents the input data for updating an existing submission.
 */
export interface UpdateSubmissionInput {
  /**
   * The content of the submission (for assignments).
   * @type {string | undefined}
   */
  content?: string;

  /**
   * The status of the submission.
   * @type {"draft" | "submitted" | "graded"}
   */
  status?: "draft" | "submitted" | "graded";
}
