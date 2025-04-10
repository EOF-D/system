// The API url for enrollments.
const API_URL =
  import.meta.env.API_URL || "http://localhost:3000/api/enrollments";

/**
 * Enrollment data interface.
 */
export interface Enrollment {
  /**
   * The ID of the enrollment.
   */
  id: number;

  /**
   * The ID of the course.
   */
  course_id: number;

  /**
   * The ID of the student.
   */
  student_id: number;

  /**
   * The enrollment status.
   */
  status: "pending" | "active" | "dropped" | "completed";

  /**
   * The enrollment date.
   */
  enrollment_date: string;

  /**
   * The final grade (if course is completed).
   */
  final_grade?: string;
}

/**
 * Invitation interface extended with course and professor details.
 */
export interface Invitation extends Enrollment {
  /**
   * The name of the course.
   */
  name: string;

  /**
   * The department prefix of the course.
   */
  prefix: string;

  /**
   * The course number.
   */
  number: string;

  /**
   * The room of the course.
   */
  room: string;

  /**
   * The start time of the course.
   */
  start_time: string;

  /**
   * The end time of the course.
   */
  end_time: string;

  /**
   * The meeting days of the course.
   */
  days: string;

  /**
   * The professor's full name.
   */
  professor_full_name: string;

  /**
   * The professor's email.
   */
  professor_email: string;
}

/**
 * Student enrollment interface extended with student details.
 */
export interface StudentEnrollment extends Enrollment {
  /**
   * The student's full name.
   */
  student_full_name: string;

  /**
   * The student's first name.
   */
  student_first_name: string;

  /**
   * The student's last name.
   */
  student_last_name: string;

  /**
   * The student's email.
   */
  student_email: string;
}

/**
 * API response interface for enrollment operations.
 */
export interface EnrollmentResponse {
  /**
   * Indicates if the request was successful.
   */
  success: boolean;

  /**
   * The data returned by the API.
   */
  data?: Enrollment | Enrollment[] | Invitation[] | StudentEnrollment[];

  /**
   * Message returned by the API.
   */
  message?: string;
}

/**
 * Get all enrollments for the current user.
 * @param {string} status - Optional filter by enrollment status.
 * @returns {Promise<EnrollmentResponse>} Promise with the enrollments response.
 */
export const getMyEnrollments = async (
  status?: "pending" | "active" | "dropped" | "completed",
): Promise<EnrollmentResponse> => {
  try {
    let url = `${API_URL}/my`;
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
    console.error("Error fetching my enrollments:", error);
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
    console.error("Error fetching invitations:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Accept a course invitation.
 * @param {number} invitationId - The ID of the invitation to accept.
 * @returns {Promise<EnrollmentResponse>} Promise with the acceptance response.
 */
export const acceptInvitation = async (
  invitationId: number,
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/accept/${invitationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error accepting invitation:", error);
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
  invitationId: number,
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/decline/${invitationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error declining invitation:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Invite a student to a course.
 * @param {number} courseId - The ID of the course.
 * @param {string} studentEmail - The email of the student to invite.
 * @returns {Promise<EnrollmentResponse>} Promise with the invitation response.
 */
export const inviteStudent = async (
  courseId: number,
  studentEmail: string,
): Promise<EnrollmentResponse> => {
  try {
    const response = await fetch(`${API_URL}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        course_id: courseId,
        student_email: studentEmail,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error inviting student:", error);
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
  courseId: number,
  status?: "pending" | "active" | "dropped" | "completed",
): Promise<EnrollmentResponse> => {
  try {
    let url = `${API_URL}/course/${courseId}`;
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
