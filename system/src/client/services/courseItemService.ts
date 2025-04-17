import { SiteConfig } from "@/client/config/config";
import {
  CourseItem,
  CreateCourseItemInput,
  UpdateCourseItemInput,
} from "@/shared/types/models/courseItem";

const API_URL = `${SiteConfig.apiUrl}/courses`;

/**
 * Course item API response interface.
 */
export interface CourseItemResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned from the API.
   * @type {CourseItem | CourseItem[] | undefined}
   */
  data?: CourseItem | CourseItem[];

  /**
   * Error message if the request failed.
   * @type {string | undefined}
   */
  message?: string;
}

/**
 * Create a new course item.
 * @param {number} id - The ID of the course.
 * @param {CreateCourseItemInput} itemData - The data for the new course item.
 * @returns {Promise<CourseItemResponse>} Promise with the creation response.
 */
export const createCourseItem = async (
  id: number,
  itemData: CreateCourseItemInput
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/${id}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(itemData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error creating course item: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Update an existing course item.
 * @param {number} id - The ID of the course.
 * @param {number} itemId - The ID of the course item to update.
 * @param {UpdateCourseItemInput} itemData - The data to update the course item with.
 * @returns {Promise<CourseItemResponse>} Promise with the update response.
 */
export const updateCourseItem = async (
  id: number,
  itemId: number,
  itemData: UpdateCourseItemInput
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/${id}/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(itemData),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error updating course item: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Delete a course item.
 * @param {number} id - The ID of the course.
 * @param {number} itemId - The ID of the course item to delete.
 * @returns {Promise<CourseItemResponse>} Promise with the deletion response.
 */
export const deleteCourseItem = async (
  id: number,
  itemId: number
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/${id}/items/${itemId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error deleting course item: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all course items for a course.
 * @param {number} id - The ID of the course.
 * @returns {Promise<CourseItemResponse>} Promise with the course items response.
 */
export const getCourseItems = async (
  id: number
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/${id}/items`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching course items: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get a specific course item.
 * @param {number} id - The ID of the course.
 * @param {number} itemId - The ID of the course item.
 * @returns {Promise<CourseItemResponse>} Promise with the course item response.
 */
export const getCourseItemById = async (
  id: number,
  itemId: number
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/${id}/items/${itemId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching course item: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get upcoming course items for the current user.
 * @param {number} limit - Maximum number of items to return.
 * @returns {Promise<CourseItemResponse>} Promise with the upcoming items response.
 */
export const getUpcomingItems = async (
  limit: number = 5
): Promise<CourseItemResponse> => {
  try {
    const response = await fetch(`${API_URL}/courses/upcoming?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching upcoming items: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
