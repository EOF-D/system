import { SiteConfig } from "@/client/config/config";
import {
  CreateQuizQuestionInput,
  CreateQuizResponseInput,
  QuizQuestion,
  QuizQuestionWithOptions,
  QuizResponse as QuizResponseType,
} from "@shared/types/models/quiz";

const API_URL = `${SiteConfig.apiUrl}/quizzes`;

/**
 * Quiz API response interface.
 */
export interface QuizResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned from the API.
   * @type {QuizQuestion | QuizQuestion[] | QuizQuestionWithOptions | QuizQuestionWithOptions[] | QuizResponseType | QuizResponseType[] | any}
   */
  data?:
    | QuizQuestion
    | QuizQuestion[]
    | QuizQuestionWithOptions
    | QuizQuestionWithOptions[]
    | QuizResponseType
    | QuizResponseType[]
    | any;

  /**
   * Error message if the request failed.
   * @type {string | undefined}
   */
  message?: string;
}

/**
 * Create a new quiz question. (Professor only)
 * @param {CreateQuizQuestionInput} questionData - The data for the new quiz question.
 * @returns {Promise<QuizResponse>} Promise with the creation response.
 */
export const createQuizQuestion = async (
  questionData: CreateQuizQuestionInput
): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${API_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(questionData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error creating quiz question: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Submit a response to a quiz question.
 * @param {CreateQuizResponseInput} responseData - The response data.
 * @returns {Promise<QuizResponse>} Promise with the submission response.
 */
export const submitQuizResponse = async (
  responseData: CreateQuizResponseInput
): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${API_URL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(responseData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error submitting quiz response: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all questions for a quiz.
 * @param {number} id - The ID of the course item (quiz).
 * @returns {Promise<QuizResponse>} Promise with the questions response.
 */
export const getQuizQuestions = async (id: number): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}/questions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching quiz questions: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all responses for a quiz submission.
 * @param {number} id - The ID of the submission.
 * @returns {Promise<QuizResponse>} Promise with the responses response.
 */
export const getQuizResponses = async (id: number): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${API_URL}/submissions/${id}/responses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching quiz responses: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Calculate score for a quiz submission. (Professor only)
 * @param {number} id - The ID of the submission.
 * @returns {Promise<QuizResponse>} Promise with the scoring response.
 */
export const calculateQuizScore = async (id: number): Promise<QuizResponse> => {
  try {
    const response = await fetch(`${API_URL}/submissions/${id}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error calculating quiz score: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
