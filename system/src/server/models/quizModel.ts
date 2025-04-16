import { getDb } from "../config/database";
import {
  CreateQuizQuestionInput,
  CreateQuizResponseInput,
  QuizOption,
  QuizQuestion,
  QuizQuestionWithOptions,
  QuizResponse,
} from "../../shared/types/models/quiz";
import { logger } from "../../shared/utils/logger";

/**
 * Handles quiz-related database operations.
 */
export class QuizModel {
  /**
   * Create a new quiz question.
   * @param {CreateQuizQuestionInput} questionData - The data for the new question.
   * @returns {Promise<QuizQuestionWithOptions>} The created question with options.
   */
  static async createQuestion(
    questionData: CreateQuizQuestionInput
  ): Promise<QuizQuestionWithOptions> {
    logger.info(`Creating quiz question: ${questionData}`);
    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      // Check if the course item exists and is a quiz.
      const courseItem = await db.get(
        "SELECT * FROM course_items WHERE id = ? AND type = 'quiz'",
        [questionData.item_id]
      );

      if (!courseItem) {
        throw new Error("Course item not found or is not a quiz");
      }

      // Create the question.
      const points = questionData.points || 1;
      const result = await db.run(
        `
        INSERT INTO quiz_questions (
          item_id, question_text, question_type, points
        ) VALUES (?, ?, ?, ?)
        `,
        [
          questionData.item_id,
          questionData.question_text,
          questionData.question_type,
          points,
        ]
      );

      // Create options if provided and question type is multiple_choice.
      const questionId = result.lastID!;
      const options: QuizOption[] = [];
      if (
        questionData.options &&
        questionData.options.length > 0 &&
        questionData.question_type === "multiple_choice"
      ) {
        for (const optionData of questionData.options) {
          const optionResult = await db.run(
            `
            INSERT INTO quiz_options (
              question_id, option_text, is_correct
            ) VALUES (?, ?, ?)
            `,
            [questionId, optionData.option_text, optionData.is_correct ? 1 : 0]
          );

          options.push({
            id: optionResult.lastID!,
            question_id: questionId,
            option_text: optionData.option_text,
            is_correct: optionData.is_correct,
          });
        }
      }

      await db.run("COMMIT");

      // Return the created question with options.
      return {
        id: questionId,
        item_id: questionData.item_id,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        points,
        options,
      };
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error creating quiz question: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Submit a response to a quiz question.
   * @param {CreateQuizResponseInput} responseData - The data for the new response.
   * @returns {Promise<QuizResponse>} The created response.
   */
  static async submitResponse(
    responseData: CreateQuizResponseInput
  ): Promise<QuizResponse> {
    logger.info(`Submitting quiz response: ${responseData}`);
    const db = await getDb();

    try {
      // Check if the submission exists.
      const submission = await db.get(
        "SELECT * FROM submissions WHERE id = ?",
        [responseData.submission_id]
      );

      if (!submission) {
        throw new Error("Submission not found");
      }

      // Check if the question exists.
      const question = await db.get(
        "SELECT * FROM quiz_questions WHERE id = ?",
        [responseData.question_id]
      );

      if (!question) {
        throw new Error("Question not found");
      }

      // For multiple choice questions, check if the response is correct.
      let isCorrect: boolean | null = null;
      if (question.question_type === "multiple_choice") {
        const correctOption = await db.get(
          "SELECT * FROM quiz_options WHERE question_id = ? AND is_correct = 1",
          [responseData.question_id]
        );

        if (correctOption) {
          isCorrect = correctOption.id.toString() === responseData.response;
        }
      }

      // Check if a response already exists.
      const existingResponse = await db.get(
        "SELECT * FROM quiz_responses WHERE submission_id = ? AND question_id = ?",
        [responseData.submission_id, responseData.question_id]
      );

      if (existingResponse) {
        // Update the existing response.
        await db.run(
          "UPDATE quiz_responses SET response = ?, is_correct = ? WHERE id = ?",
          [responseData.response, isCorrect, existingResponse.id]
        );

        // Get the updated response.
        const updatedResponse = await db.get<QuizResponse>(
          "SELECT * FROM quiz_responses WHERE id = ?",
          [existingResponse.id]
        );

        return updatedResponse!;
      }

      // Create a new response.
      const result = await db.run(
        `
        INSERT INTO quiz_responses (
          submission_id, question_id, response, is_correct
        ) VALUES (?, ?, ?, ?)
        `,
        [
          responseData.submission_id,
          responseData.question_id,
          responseData.response,
          isCorrect,
        ]
      );

      const response = await db.get<QuizResponse>(
        "SELECT * FROM quiz_responses WHERE id = ?",
        [result.lastID]
      );

      return response!;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all questions for a quiz.
   * @param {number} itemId - The ID of the course item (quiz).
   * @returns {Promise<QuizQuestionWithOptions[]>} The quiz questions with options.
   */
  static async getQuizQuestions(
    itemId: number
  ): Promise<QuizQuestionWithOptions[]> {
    logger.info(`Getting quiz questions for item: ${itemId}`);
    const db = await getDb();

    try {
      // Get all questions for the quiz.
      const questions = await db.all<QuizQuestion[]>(
        "SELECT * FROM quiz_questions WHERE item_id = ? ORDER BY id",
        [itemId]
      );

      const questionsWithOptions: QuizQuestionWithOptions[] = [];
      for (const question of questions) {
        const questionWithOptions: QuizQuestionWithOptions = { ...question };

        // If the question is a multiple choice question, get its options.
        if (question.question_type === "multiple_choice") {
          const options = await db.all<QuizOption[]>(
            "SELECT * FROM quiz_options WHERE question_id = ? ORDER BY id",
            [question.id]
          );

          questionWithOptions.options = options;
        }

        // Add the question to the list.
        questionsWithOptions.push(questionWithOptions);
      }

      return questionsWithOptions;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all responses for a submission.
   * @param {number} submissionId - The ID of the submission.
   * @returns {Promise<QuizResponse[]>} The quiz responses.
   */
  static async getSubmissionResponses(
    submissionId: number
  ): Promise<QuizResponse[]> {
    logger.info(`Getting quiz responses for submission: ${submissionId}`);
    const db = await getDb();

    try {
      const responses = await db.all<QuizResponse[]>(
        "SELECT * FROM quiz_responses WHERE submission_id = ? ORDER BY question_id",
        [submissionId]
      );

      return responses;
    } finally {
      await db.close();
    }
  }

  /**
   * Calculate the score for a quiz submission.
   * @param {number} submissionId - The ID of the submission.
   * @returns {Promise<number>} The score (points earned).
   */
  static async calculateScore(submissionId: number): Promise<number> {
    logger.info(`Calculating score for submission: ${submissionId}`);
    const db = await getDb();

    try {
      // Get the submission.
      const submission = await db.get(
        "SELECT * FROM submissions WHERE id = ?",
        [submissionId]
      );

      if (!submission) {
        throw new Error("Submission not found");
      }

      // Get all responses for the submission.
      const responses = await db.all<QuizResponse[]>(
        "SELECT * FROM quiz_responses WHERE submission_id = ?",
        [submissionId]
      );

      // Calculate the score.
      let totalScore = 0;
      for (const response of responses) {
        const question = await db.get<QuizQuestion>(
          "SELECT * FROM quiz_questions WHERE id = ?",
          [response.question_id]
        );

        if (question && response.is_correct) {
          totalScore += question.points;
        }
      }

      return totalScore;
    } finally {
      await db.close();
    }
  }
}
