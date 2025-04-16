import { SiteConfig } from "@/client/config/config";
import {
  Course,
  CourseWithEnrollments,
  CourseWithProfessor,
  CreateCourseInput,
  UpdateCourseInput,
} from "@shared/types/models/course";

const API_URL = `${SiteConfig.apiUrl}/courses`;

/**
 * Course API response interface.
 */
export interface CourseResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned from the API.
   * @type {Course | Course[] | CourseWithProfessor[] | CourseWithEnrollments[]}
   */
  data?: Course | Course[] | CourseWithProfessor[] | CourseWithEnrollments[];

  /**
   * Error message if the request failed.
   * @type {string | null}
   */
  message?: string;
}

/**
 * Create a new course.
 * @param {CreateCourseInput} courseData - The data for the new course.
 * @returns {Promise<CourseResponse>} Promise with the creation response.
 */
export const createCourse = async (
  courseData: CreateCourseInput
): Promise<CourseResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(courseData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error creating course: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Update an existing course.
 * @param {number} id - The ID of the course to update.
 * @param {UpdateCourseInput} courseData - The data to update the course with.
 * @returns {Promise<CourseResponse>} Promise with the update response.
 */
export const updateCourse = async (
  id: number,
  courseData: UpdateCourseInput
): Promise<CourseResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(courseData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error updating course: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Delete a course.
 * @param {number} id - The ID of the course to delete.
 * @returns {Promise<CourseResponse>} Promise with the deletion response.
 */
export const deleteCourse = async (id: number): Promise<CourseResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error deleting course: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get a course by ID.
 * @param {number} id - The ID of the course to retrieve.
 * @returns {Promise<CourseResponse>} Promise with the course response.
 */
export const getCourseById = async (id: number): Promise<CourseResponse> => {
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
    console.error(`Error fetching course: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all courses for the current user.
 * @param {string} status - Filter courses by enrollment status (active, dropped, completed, pending).
 * @returns {Promise<CourseResponse>} Promise with the courses response.
 */
export const getCourses = async (
  status: "active" | "dropped" | "completed" | "pending" = "active"
): Promise<CourseResponse> => {
  try {
    const response = await fetch(`${API_URL}?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching courses: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get student enrollments for a course.
 * @param {number} id - The ID of the course.
 * @returns {Promise<CourseResponse>} Promise with the enrollments response.
 */
export const getCourseEnrollments = async (
  id: number
): Promise<CourseResponse> => {
  try {
    const response = await fetch(`${API_URL}/${id}/enrollments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching course enrollments: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
