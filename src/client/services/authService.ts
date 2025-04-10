// The API url for user authentication.
const API_URL = import.meta.env.API_URL || "http://localhost:3000/api/users";

/**
 * Login credentials interface.
 */
interface LoginCredentials {
  /**
   * User email.
   */
  email: string;

  /**
   * User password.
   */
  password: string;
}

/**
 * Profile data interface.
 */
interface ProfileData {
  /**
   * First name of the user.
   */
  first_name: string;

  /**
   * Last name of the user.
   */
  last_name: string;

  /**
   * Major of the user. (Not used for professors).
   */
  major?: string;

  /**
   * Graduation year of the user (Not used for professors).
   */
  graduation_year?: number;
}

/**
 * Sign up data interface.
 */
interface SignUpData {
  /**
   * Profile data for the user.
   */
  profile: ProfileData;

  /**
   * User email.
   */
  email: string;

  /**
   * User password.
   */
  password: string;

  /**
   * User role.
   */
  role?: string;
}

/**
 * User update data interface.
 */
interface UserUpdateData {
  /**
   * New profile data for the user.
   */
  profile?: ProfileData;

  /**
   * New user email.
   */
  email?: string;

  /**
   * New user password.
   */
  password?: string;

  /**
   * New user role.
   */
  role?: string;
}

/**
 * User data interface.
 */
interface UserData {
  /**
   * User ID.
   */
  id: number;

  /**
   * Profile ID.
   */
  profile_id: number;

  /**
   * User first name.
   */
  first_name: string;

  /**
   * User last name.
   */
  last_name: string;

  /**
   * User major.
   */
  major: string | null;

  /**
   * User graduation year.
   */
  graduation_year: number | null;

  /**
   * User email.
   */
  email: string;

  /**
   * User role.
   */
  role: string;

  /**
   * User created date.
   */
  created_at: string;

  /**
   * User updated date.
   */
  updated_at: string;

  /**
   * Authentication token.
   */
  token: string;
}

/**
 * Authentication response interface.
 */
interface AuthResponse {
  /**
   * Indicates if the request was successful.
   */
  success: boolean;

  /**
   * The data returned from the API.
   */
  data?: UserData;

  /**
   * Error message if the request failed.
   */
  message?: string;
}

/**
 * Login a user.
 * @param {LoginCredentials} credentials - User credentials (email and password).
 * @returns {Promise<AuthResponse>} Promise with the login response.
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    // Send a request to the API to log in the user.
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    // Store token if login was successful.
    if (data.success && data.data.token) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Register a new user.
 * @param {SignUpData} userData - User registration data.
 * @returns {Promise<AuthResponse>} Promise with the registration response.
 */
export const signUp = async (userData: SignUpData): Promise<AuthResponse> => {
  try {
    // Send a request to the API to register the user.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    // Store token if registration was successful.
    if (data.success && data.data.token) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: "Network error. Please try again later.",
    };
  }
};

/**
 * Logout the current user.
 */
export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Update user data.
 * @param {UserUpdateData} userData - User data to update.
 * @returns {Promise<AuthResponse>} Promise with the update response.
 */
export const updateUser = async (
  userData: UserUpdateData
): Promise<AuthResponse> => {
  try {
    // Send a request to the API to update the user.
    const response = await fetch(`${API_URL}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    // Store token if update was successful.
    if (data.success) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error("Update error:", error);
    return {
      success: false,
      message: "Server error. Please try again later.",
    };
  }
};

/**
 * Get the current user's profile.
 * @returns {Promise<AuthResponse>} Promise with the user profile response.
 */
export const fetchUserProfile = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      // Update the stored user data.
      localStorage.setItem("user", JSON.stringify(data.data));
    }

    return data;
  } catch (error) {
    console.error("Fetch profile error:", error);
    return {
      success: false,
      message: "Server error. Please try again later.",
    };
  }
};

/**
 * Get the current authenticated user.
 * @return {UserData|null} The current user object or null if not authenticated.
 */
export const getCurrentUser = (): UserData | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error("Error parsing user data from localStorage", e);
    return null;
  }
};

/**
 * Get the full name of the current user.
 * @returns {string} The user's full name or empty string if not authenticated.
 */
export const getUserFullName = (): string => {
  const user = getCurrentUser();
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`;
};

/**
 * Check if the current user is authenticated.
 * @returns {boolean} Boolean indicating if user is authenticated.
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};

/**
 * Check if the current user has admin role.
 * @returns {boolean} Boolean indicating if user is an admin.
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "admin";
};

/**
 * Check if the current user has professor role.
 * @returns {boolean} Boolean indicating if user is a professor.
 */
export const isProfessor = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "professor";
};

/**
 * Get the current authentication token.
 * @returns {string|null} The authentication token or null if not authenticated.
 */
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};
