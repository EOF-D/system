/**
 * Represents a quiz question in a course item.
 */
export interface QuizQuestion {
  /**
   * The ID of the question.
   * @type {number}
   */
  id: number;

  /**
   * The ID of the course item (quiz).
   * @type {number}
   */
  item_id: number;

  /**
   * The text of the question.
   * @type {string}
   */
  question_text: string;

  /**
   * The type of question.
   * @type {"multiple_choice" | "short_answer"}
   */
  question_type: "multiple_choice" | "short_answer";

  /**
   * The points for this question.
   * @type {number}
   */
  points: number;
}

/**
 * Represents an option for a quiz question (for MCQs).
 */
export interface QuizOption {
  /**
   * The ID of the option.
   * @type {number}
   */
  id: number;

  /**
   * The ID of the question this option belongs to.
   * @type {number}
   */
  question_id: number;

  /**
   * The text of the option.
   * @type {string}
   */
  option_text: string;

  /**
   * Whether this option is correct or not. Hidden from students.
   * @type {boolean | undefined}
   */
  is_correct?: boolean;
}

/**
 * Represents a quiz question with options (for MCQs).
 * @extends QuizQuestion
 */
export interface QuizQuestionWithOptions extends QuizQuestion {
  /**
   * The options for this question (for multiple choice questions).
   */
  options?: QuizOption[];
}

/**
 * Represents a student's response to a quiz question.
 */
export interface QuizResponse {
  /**
   * The ID of the response.
   * @type {number}
   */
  id: number;

  /**
   * The ID of the submission.
   * @type {number}
   */
  submission_id: number;

  /**
   * The ID of the question.
   * @type {number}
   */
  question_id: number;

  /**
   * The student's response.
   * @type {string}
   */
  response: string;

  /**
   * Whether the response is correct or not.
   * @type {boolean | undefined}
   */
  is_correct?: boolean;
}

/**
 * Represents the input data for creating a new quiz question.
 */
export interface CreateQuizQuestionInput {
  /**
   * The ID of the course item (quiz).
   * @type {number}
   */
  item_id: number;

  /**
   * The text of the question.
   * @type {string}
   */
  question_text: string;

  /**
   * The type of question.
   * @type {"multiple_choice" | "short_answer"}
   */
  question_type: "multiple_choice" | "short_answer";

  /**
   * The points for this question.
   * @type {number | undefined}
   */
  points?: number;

  /**
   * The options for this question (for MCQs).
   * @type {Array<{ option_text: string; is_correct: boolean }> | undefined}
   */
  options?: {
    /**
     * The text of the option.
     */
    option_text: string;

    /**
     * Whether this option is correct.
     */
    is_correct: boolean;
  }[];
}

/**
 * Represents the input data for creating a new quiz response.
 */
export interface CreateQuizResponseInput {
  /**
   * The ID of the submission.
   * @type {number}
   */
  submission_id: number;

  /**
   * The ID of the question.
   * @type {number}
   */
  question_id: number;

  /**
   * The student's response.
   * @type {string}
   */
  response: string;
}
