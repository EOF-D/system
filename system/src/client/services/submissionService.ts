import { SiteConfig } from "@/client/config/config";
import {
  Submission,
  SubmissionWithDetails,
  CreateSubmissionInput,
  UpdateSubmissionInput,
} from "@shared/types/models/submission";

const API_URL = `${SiteConfig.apiUrl}/submissions`;

/**
 * Submission API response interface.
 */
export interface SubmissionResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned from the API.
   * @type {Submission | Submission[] | SubmissionWithDetails | SubmissionWithDetails[] | undefined}
   */
  data?:
    | Submission
    | Submission[]
    | SubmissionWithDetails
    | SubmissionWithDetails[];

  /**
   * Error message if the request failed.
   * @type {string | undefined}
   */
  message?: string;
}

/**
 * Create a new submission.
 * @param {CreateSubmissionInput} submissionData - The data for the new submission.
 * @returns {Promise<SubmissionResponse>} Promise with the creation response.
 */
export const createSubmission = async (
  submissionData: CreateSubmissionInput
): Promise<SubmissionResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(submissionData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error creating submission: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Update an existing submission.
 * @param {number} id - The ID of the submission to update.
 * @param {UpdateSubmissionInput} updateData - The data to update the submission with.
 * @returns {Promise<SubmissionResponse>} Promise with the update response.
 */
export const updateSubmission = async (
  id: number,
  updateData: UpdateSubmissionInput
): Promise<SubmissionResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updateData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error updating submission: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get a specific submission by ID.
 * @param {number} id - The ID of the submission to retrieve.
 * @returns {Promise<SubmissionResponse>} Promise with the submission response.
 */
export const getSubmissionById = async (
  id: number
): Promise<SubmissionResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching submission: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all submissions for the current student.
 * @param {number} courseId - Optional course ID to filter submissions by.
 * @returns {Promise<SubmissionResponse>} Promise with the submissions response.
 */
export const getMySubmissions = async (
  courseId?: number
): Promise<SubmissionResponse> => {
  try {
    let url = API_URL;
    if (courseId) {
      url += `?course_id=${courseId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching my submissions: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all submissions for a course item. (Professor only)
 * @param {number} itemId - The ID of the course item.
 * @returns {Promise<SubmissionResponse>} Promise with the submissions response.
 */
export const getSubmissionsByItemId = async (
  itemId: number
): Promise<SubmissionResponse> => {
  try {
    const response = await fetch(`${API_URL}/item/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching submissions by item ID: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
