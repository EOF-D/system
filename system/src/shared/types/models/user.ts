/**
 * Represents a user in the system.
 */
export interface User {
  /**
   * The ID of the user.
   * @type {number}
   */
  id: number;

  /**
   * The profile ID of the user.
   * @type {number}
   */
  profile_id: number;

  /**
   * The first name of the user.
   * @type {string}
   */
  first_name: string;

  /**
   * The last name of the user.
   * @type {string}
   */
  last_name: string;

  /**
   * The major of the user.
   * @type {string | null}
   */
  major: string | null;

  /**
   * The graduation year of the user.
   * @type {number | null}
   */
  graduation_year: number | null;

  /**
   * The time the user was created.
   * @type {string}
   */
  created_at: string;

  /**
   * The last time the user was updated.
   * @type {string}
   */
  updated_at: string;

  /**
   * The email address of the user.
   * @type {string}
   */
  email: string;

  /**
   * The hashed password of the user.
   * @type {string | undefined}
   */
  password?: string;

  /**
   * The role of the user (e.g., admin, user, professor).
   * @type {"user" | "admin" | "professor"}
   * @default 'user'
   */
  role: "user" | "admin" | "professor";
}

/**
 * Represents the input data for creating a new user.
 */
export interface CreateUserInput {
  /**
   * Profile data for the user.
   * @type {Object}
   */
  profile: {
    /**
     * First name of the user.
     * @type {string}
     */
    first_name: string;

    /**
     * Last name of the user.
     * @type {string}
     */
    last_name: string;

    /**
     * Major of the user. (Not used for professors).
     * @type {string | undefined}
     */
    major?: string;

    /**
     * Graduation year of the user (Not used for professors).
     * @type {number | undefined}
     */
    graduation_year?: number;
  };

  /**
   * Email address of the user.
   * @type {string}
   */
  email: string;

  /**
   * Password of the user.
   * @type {string}
   */
  password: string;

  /**
   * Role of the user (e.g., admin, user, professor).
   * @type {"user" | "admin" | "professor"}
   * @default 'user'
   */
  role: "user" | "admin" | "professor";
}

/**
 * Represents the input data for updating an existing user.
 */
export interface UpdateUserInput {
  /**
   * New profile data for the user.
   * @type {Object | undefined}
   */
  profile?: {
    /**
     * First name of the user.
     * @type {string | undefined}
     */
    first_name?: string;

    /**
     * Last name of the user.
     * @type {string | undefined}
     */
    last_name?: string;

    /**
     * Major of the user. (Not used for professors).
     * @type {string | undefined}
     */
    major?: string;

    /**
     * Graduation year of the user (Not used for professors).
     * @type {number | undefined}
     */
    graduation_year?: number;
  };

  /**
   * New email address of the user.
   * @type {string | undefined}
   */
  email?: string;

  /**
   * New password of the user.
   * @type {string | undefined}
   */
  password?: string;

  /**
   * New role of the user (e.g., admin, user, professor).
   * @type {"user" | "admin" | "professor" | undefined}
   */
  role?: "user" | "admin" | "professor";
}
