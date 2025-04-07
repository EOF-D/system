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
 * Sign up data interface.
 */
interface SignUpData {
  /**
   * User name.
   */
  name: string;

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
 * User update data interface.
 */
interface UserUpdateData {
  /**
   * New user name.
   */
  name: string;

  /**
   * New user email.
   */
  email: string;

  /**
   * New user password.
   */
  password: string;

  /**
   * New user role.
   */
  role: string;
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
  data?: {
    /**
     * User ID.
     */
    id: number;

    /**
     * User name.
     */
    name: string;

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
     * User created date.
     */
    token: string;
  };

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
 * Update user data.
 * @param {UserUpdateData} userData - User data to update.
 * @returns {Promise<AuthResponse>} Promise with the update response.
 */
export const updateUser = async (
  userData: UserUpdateData
): Promise<AuthResponse> => {
  try {
    // Send a request to the API to register the user.
    const response = await fetch(API_URL, {
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
 * Logout the current user.
 */
export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Get the current authenticated user.
 * @return {Object|null} The current user object or null if not authenticated.
 */
export const getCurrentUser = (): object | null => {
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
 * Check if the current user is authenticated.
 * @returns {boolean} Boolean indicating if user is authenticated.
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("token");
};

/**
 * Get the current authentication token.
 * @returns {string|null} The authentication token or null if not authenticated.
 */
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};
