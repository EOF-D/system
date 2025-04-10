// The API url for courses.
const API_URL = import.meta.env.API_URL || "http://localhost:3000/api/courses";

/**
 * Course data interface.
 */
export interface Course {
  /**
   * The ID of the course.
   */
  id: number;

  /**
   * The ID of the professor teaching the course.
   */
  professor_id: number;

  /**
   * The name of the course.
   */
  name: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number: string;

  /**
   * Room where the course is held.
   */
  room: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days: string;
}

/**
 * Course for students with professor details.
 */
export interface StudentCourse extends Course {
  /**
   * The full name of the professor.
   */
  professor_full_name: string;

  /**
   * The email of the professor.
   */
  professor_email: string;

  /**
   * The final grade (if course is completed).
   */
  final_grade?: string;
}

/**
 * Course for professors with student count.
 */
export interface ProfessorCourse extends Course {
  /**
   * Number of students enrolled in the course.
   */
  enrollment_count: number;

  /**
   * Number of assignments in the course.
   */
  assignment_count: number;
}

/**
 * Input data for creating a new course.
 */
export interface CreateCourseInput {
  /**
   * The name of the course.
   */
  name: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number: string;

  /**
   * Room where the course is held.
   */
  room: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days: string;
}

/**
 * Input data for updating an existing course.
 */
export interface UpdateCourseInput {
  /**
   * The name of the course.
   */
  name?: string;

  /**
   * Department code (e.g., CSI, MATH).
   */
  prefix?: string;

  /**
   * Course number (e.g., 101, 102).
   */
  number?: string;

  /**
   * Room where the course is held.
   */
  room?: string;

  /**
   * Start time of the course (HH:MM in 24-hour format).
   */
  start_time?: string;

  /**
   * End time of the course (HH:MM in 24-hour format).
   */
  end_time?: string;

  /**
   * Meeting days (format: "M,...,F" e.g., "M,W,F").
   */
  days?: string;
}

/**
 * Course API response interface.
 */
export interface CourseResponse {
  /**
   * Indicates if the request was successful.
   */
  success: boolean;

  /**
   * The data returned from the API.
   */
  data?: Course | Course[] | StudentCourse[] | ProfessorCourse[];

  /**
   * Error message if the request failed.
   */
  message?: string;
}

/**
 * Get all courses for the current user.
 * @param {string} status - Filter courses by enrollment status (active, dropped, completed, pending).
 * @returns {Promise<CourseResponse>} Promise with the courses response.
 */
export const getCourses = async (
  status: "active" | "dropped" | "completed" | "pending" = "active",
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
    console.error("Error fetching courses:", error);
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
    console.error("Error fetching course:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Create a new course.
 * @param {CreateCourseInput} courseData - The data for the new course.
 * @returns {Promise<CourseResponse>} Promise with the creation response.
 */
export const createCourse = async (
  courseData: CreateCourseInput,
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
    console.error("Error creating course:", error);
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
  courseData: UpdateCourseInput,
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
    console.error("Error updating course:", error);
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
    console.error("Error deleting course:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get student enrollments for a course.
 * @param {number} courseId - The ID of the course.
 * @returns {Promise<CourseResponse>} Promise with the enrollments response.
 */
export const getCourseEnrollments = async (
  courseId: number,
): Promise<CourseResponse> => {
  try {
    const response = await fetch(`${API_URL}/${courseId}/enrollments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Format time from 24-hour to 12-hour format.
 * @param {string} time - Time in 24-hour format (HH:MM).
 * @returns {string} Time in 12-hour format with AM/PM.
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return `${displayHour}:${minutes} ${suffix}`;
};

/**
 * Format days from abbreviated to full names.
 * @param {string} days - Days in abbreviated format (e.g., "M,W,F").
 * @returns {string} Days in full name format (e.g., "Monday, Wednesday, Friday").
 */
export const formatDays = (days: string): string => {
  const dayMap: Record<string, string> = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
  };

  return days
    .split(",")
    .map((day) => dayMap[day] || day)
    .join(", ");
};

/**
 * Format date to a readable string.
 * @param {string} dateString - Date in ISO format.
 * @returns {string} Formatted date string.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};
