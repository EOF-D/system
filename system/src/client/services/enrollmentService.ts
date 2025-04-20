import { SiteConfig } from "@/client/config/config";
import {
  Enrollment,
  EnrollmentWithCourseDetails,
  EnrollmentWithStudentDetails,
} from "@shared/types/models/enrollment";

const API_URL = `${SiteConfig.apiUrl}/enrollments`;

/**
 * Enrollment API response interface.
 */
export interface EnrollmentResponse {
  /**
   * Indicates if the request was successful.
   * @type {boolean}
   */
  success: boolean;

  /**
   * The data returned by the API.
   * @type {Enrollment | Enrollment[] | EnrollmentWithCourseDetails[] | EnrollmentWithStudentDetails[]}
   */
  data?:
    | Enrollment
    | Enrollment[]
    | EnrollmentWithCourseDetails[]
    | EnrollmentWithStudentDetails[];

  /**
   * Message returned by the API.
   * @type {string | undefined}
   */
  message?: string;
}

/**
 * Invite a student to a course.
 * @param {number} id - The ID of the course.
 * @param {string} studentEmail - The email of the student to invite.
 * @param {string} section - The section of the course (default is "01").
 * @returns {Promise<EnrollmentResponse>} Promise with the invitation response.
 */
export const inviteStudent = async (
  id: number,
  studentEmail: string,
  section: string = "01"
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        course_id: id,
        student_email: studentEmail,
        section: section,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error inviting student: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Accept a course invitation.
 * @param {number} id - The ID of the invitation to accept.
 * @returns {Promise<EnrollmentResponse>} Promise with the acceptance response.
 */
export const acceptInvitation = async (
  id: number
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/accept/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error accepting invitation: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Decline a course invitation.
 * @param {number} invitationId - The ID of the invitation to decline.
 * @returns {Promise<EnrollmentResponse>} Promise with the declination response.
 */
export const declineInvitation = async (
  id: number
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/decline/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error declining invitation: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get all enrollments for the current user.
 * @param {string} status - Optional filter by enrollment status.
 * @returns {Promise<EnrollmentResponse>} Promise with the enrollments response.
 */
export const getMyEnrollments = async (
  status?: "pending" | "active" | "dropped" | "completed"
): Promise<EnrollmentResponse> => {
  try {
    let url = `${API_URL}/me`;
    if (status) {
      url += `?status=${status}`;
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
    console.error(`Error fetching my enrollments: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get pending invitations for the current user.
 * @returns {Promise<EnrollmentResponse>} Promise with the invitations response.
 */
export const getMyInvitations = async (): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/invitations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching invitations: ${error}`);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Get enrollments for a specific course.
 * @param {number} courseId - The ID of the course.
 * @param {string} status - Optional filter by enrollment status.
 * @returns {Promise<EnrollmentResponse>} Promise with the enrollments response.
 */
export const getCourseEnrollments = async (
  id: number,
  status?: "pending" | "active" | "dropped" | "completed"
): Promise<EnrollmentResponse> => {
  try {
    let url = `${API_URL}/course/${id}`;
    if (status) {
      url += `?status=${status}`;
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
    console.error("Error fetching course enrollments:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};
