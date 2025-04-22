import { SiteConfig } from "@/client/config/config";
import { CourseItem } from "@/shared/types/models/courseItem";
import {
  Grade,
  GradeInput,
  GradeWithItemDetails,
} from "@/shared/types/models/grade";
import { User } from "@/shared/types/models/user";

const API_URL = `${SiteConfig.apiUrl}/grades`;

/**
 * Grade API response interface.
 */
export interface GradeResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned from the API.
   */
  data?:
    | Grade
    | { student: User; grades: GradeWithItemDetails[] }
    | GradeWithItemDetails[]
    | {
        grades: GradeWithItemDetails[];
        ungraded_items: CourseItem[];
        final_grade: string | null;
      }
    | { student_id: number; final_grade: string }[];

  /**
   * Error message if the request failed.
   * @type {string | undefined}
   */
  message?: string;
}

/**
 * Grade a submission.
 * @param {GradeInput} gradeData - The grade data to submit.
 * @returns {Promise<GradeResponse>} Promise with the grading response.
 */
export const gradeSubmission = async (
  gradeData: GradeInput
): Promise<GradeResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(gradeData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error grading submission: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get grades for a student in a course.
 * @param {number} courseId - The ID of the course.
 * @param {number} studentId - The ID of the student.
 * @returns {Promise<GradeResponse>} Promise with the grades response.
 */
export const getStudentGradesForCourse = async (
  courseId: number,
  studentId: number
): Promise<GradeResponse> => {
  try {
    const response = await fetch(
      `${API_URL}/course/${courseId}/student/${studentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error(`Error getting student grades: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all grades for a course item.
 * @param {number} itemId - The ID of the course item.
 * @returns {Promise<GradeResponse>} Promise with the grades response.
 */
export const getGradesByItemId = async (
  itemId: number
): Promise<GradeResponse> => {
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
    console.error(`Error getting grades by item ID: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get grades for the current student in a course.
 * @param {number} courseId - The ID of the course.
 * @returns {Promise<GradeResponse>} Promise with the grades response.
 */
export const getMyGradesForCourse = async (
  courseId: number
): Promise<GradeResponse> => {
  try {
    const response = await fetch(`${API_URL}/me/course/${courseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error getting my grades: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Calculate final grades for a course.
 * @param {number} courseId - The ID of the course.
 * @returns {Promise<GradeResponse>} Promise with the finalization response.
 */
export const finalizeGradesForCourse = async (
  courseId: number
): Promise<GradeResponse> => {
  try {
    const response = await fetch(`${API_URL}/finalize/course/${courseId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error finalizing grades: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
