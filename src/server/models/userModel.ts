import bcrypt from "bcryptjs";
import { getDb } from "../config/database";

export interface User {
  /**
   * Unique identifier for the user.
   */
  id: number;

  /**
   * Unique identifier for the user's profile.
   */
  profile_id: number;

  /**
   * The first name of the user.
   */
  first_name: string;

  /**
   * The last name of the user.
   */
  last_name: string;

  /**
   * The ID of the profile associated with the user.
   */
  major: string | null;

  /**
   * The graduation year of the user.
   */
  graduation_year: number | null;

  /**
   * The time the user was created.
   */
  created_at: string;

  /**
   * The last time the user was updated.
   */
  updated_at: string;

  /**
   * The email address of the user.
   */
  email: string;

  /**
   * The hashed password of the user.
   */
  password?: string;

  /**
   * The role of the user (e.g., admin, user, professor).
   * Default is 'user'.
   */
  role: string;
}

/**
 * Input data for creating a new user.
 */
export interface CreateUserInput {
  /**
   * Profile data for the user.
   */
  profile: {
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
  };

  /**
   * Email address of the user.
   */
  email: string;

  /**
   * Password of the user.
   */
  password: string;

  /**
   * Role of the user (e.g., admin, user, professor).
   */
  role: string;
}

/**
 * Input data for updating an existing user.
 */
export interface UpdateUserInput {
  /**
   * New profile data for the user.
   */
  profile?: {
    /**
     * First name of the user.
     */
    first_name?: string;

    /**
     * Last name of the user.
     */
    last_name?: string;

    /**
     * Major of the user. (Not used for professors).
     */
    major?: string;

    /**
     * Graduation year of the user (Not used for professors).
     */
    graduation_year?: number;
  };

  /**
   * New email address of the user.
   */
  email?: string;

  /**
   * New password of the user.
   */
  password?: string;

  /**
   * New role of the user (e.g., admin, user, professor).
   */
  role?: string;
}

/**
 * User model for interacting with the database.
 * This model provides methods to create, read, update, and delete users.
 */
export class UserModel {
  private static USER_COLUMNS = `
    u.id,
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.major,
    p.graduation_year,
    p.created_at,
    p.updated_at,
    u.email,
    u.role
  `;

  private static USER_JOIN = `
    FROM users u JOIN profiles p ON u.profile_id = p.id
  `;

  /**
   * Get all users from the database.
   * @returns {Promise<Omit<User, 'password'>[]>} List of users without passwords.
   */
  static async findAll(): Promise<Omit<User, "password">[]> {
    const db = await getDb();

    try {
      const users = await db.all<Omit<User, "password">[]>(`
        SELECT ${UserModel.USER_COLUMNS}
        ${UserModel.USER_JOIN};
      `);
      return users;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a user by ID from the database.
   * @param {number} id - The ID of the user to retrieve.
   * @returns {Promise<Omit<User, 'password'> | null>} The user without password or null if not found.
   */
  static async findById(id: number): Promise<Omit<User, "password"> | null> {
    const db = await getDb();

    try {
      const user = await db.get<Omit<User, "password">>(
        `
        SELECT ${UserModel.USER_COLUMNS}
        ${UserModel.USER_JOIN}
        WHERE u.id = ?;
      `,
        [id]
      );

      return user || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Get a user by email from the database.
   * Includes password for authentication purposes.
   * @param {string} email - The email of the user to retrieve.
   * @returns {Promise<User | null>} The user or null if not found.
   */
  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDb();

    try {
      const user = await db.get<User>(
        `
        SELECT p.id AS profile_id, u.*, p.first_name, p.last_name, p.major, p.graduation_year
        FROM users u JOIN profiles p ON u.profile_id = p.id
        WHERE u.email = ?;
      `,
        [email]
      );

      return user || null;
    } finally {
      await db.close();
    }
  }

  /**
   * Create a new user in the database.
   * @param {CreateUserInput} userData - The data for the new user.
   * @returns {Promise<Omit<User, 'password'>>} The created user without password.
   */
  static async create(
    userData: CreateUserInput
  ): Promise<Omit<User, "password">> {
    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");
      const profileResult = await db.run(
        `
        INSERT INTO profiles (first_name, last_name, major, graduation_year) 
        VALUES (?, ?, ?, ?)
      `,
        [
          userData.profile.first_name,
          userData.profile.last_name,
          userData.profile.major || null,
          userData.profile.graduation_year || null,
        ]
      );

      const profileId = profileResult.lastID;

      // Hash the password before storing it.
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Set default role to 'user' if not provided.
      const role = userData.role || "user";

      const userResult = await db.run(
        `
        INSERT INTO users (profile_id, email, password, role) 
        VALUES (?, ?, ?, ?)
      `,
        [profileId, userData.email, hashedPassword, role]
      );

      await db.run("COMMIT");
      const userId = userResult.lastID;

      // Get the created user without password.
      const newUser = await this.findById(userId!);
      return newUser!;
    } catch (error) {
      // Rollback in case of error.
      await db.run("ROLLBACK");
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Update an existing user in the database.
   * @param {number} id - The ID of the user to update.
   * @param {UpdateUserInput} updateData  - The data to update the user with.
   * @returns {Promise<Omit<User, 'password'> | null>} The updated user without password or null if not found.
   */
  static async update(
    id: number,
    updateData: UpdateUserInput
  ): Promise<Omit<User, "password"> | null> {
    const db = await getDb();
    try {
      await db.run("BEGIN TRANSACTION");

      // Get the current user to check if it exists.
      const currentUser = await UserModel.findById(id);
      if (!currentUser) {
        await db.run("ROLLBACK");
        return null;
      }

      // Update profile if needed.
      if (updateData.profile) {
        const profileValues: any[] = [];
        let profileQuery = "UPDATE profiles SET ";
        let hasProfileUpdates = false;

        if (updateData.profile.first_name) {
          profileQuery += "first_name = ?, ";
          hasProfileUpdates = true;

          profileValues.push(updateData.profile.first_name);
        }

        if (updateData.profile.last_name) {
          profileQuery += "last_name = ?, ";
          hasProfileUpdates = true;

          profileValues.push(updateData.profile.last_name);
        }

        if (updateData.profile.major !== undefined) {
          profileQuery += "major = ?, ";
          hasProfileUpdates = true;

          profileValues.push(updateData.profile.major);
        }

        if (updateData.profile.graduation_year !== undefined) {
          profileQuery += "graduation_year = ?, ";
          hasProfileUpdates = true;

          profileValues.push(updateData.profile.graduation_year);
        }

        if (hasProfileUpdates) {
          profileQuery += "updated_at = CURRENT_TIMESTAMP WHERE id = ?";
          profileValues.push(currentUser.profile_id);

          await db.run(profileQuery, profileValues);
        }
      }

      // Update user if needed.
      const userValues: any[] = [];
      let userQuery = "UPDATE users SET ";
      let hasUserUpdates = false;

      if (updateData.email) {
        hasUserUpdates = true;
        userQuery += "email = ?, ";

        userValues.push(updateData.email);
      }

      if (updateData.password) {
        // Hash the new password before storing it.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updateData.password, salt);

        userQuery += "password = ?, ";
        hasUserUpdates = true;

        userValues.push(hashedPassword);
      }

      if (updateData.role) {
        userQuery += "role = ?, ";
        hasUserUpdates = true;

        userValues.push(updateData.role);
      }

      if (hasUserUpdates) {
        // Remove trailing comma if present.
        if (userQuery.endsWith(", ")) {
          userQuery = userQuery.slice(0, -2);
        }

        userQuery += " WHERE id = ?";
        userValues.push(id);

        await db.run(userQuery, userValues);
      }

      await db.run("COMMIT");

      // Get the updated user.
      return await UserModel.findById(id);
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Delete a user from the database.
   * @param {number} id - The ID of the user to delete.
   * @returns {Promise<boolean>} True if the user was deleted, false otherwise.
   */
  static async delete(id: number): Promise<boolean> {
    const db = await getDb();
    try {
      await db.run("BEGIN TRANSACTION");

      // Find the user to get the profile_id.
      const user = await UserModel.findById(id);
      if (!user) {
        await db.run("ROLLBACK");
        return false;
      }

      // Delete the user first.
      const userResult = await db.run("DELETE FROM users WHERE id = ?", [id]);

      // If user was successfully deleted, also delete the profile.
      if (userResult.changes! > 0) {
        await db.run("DELETE FROM profiles WHERE id = ?", [user.profile_id]);
      }

      await db.run("COMMIT");
      return userResult.changes! > 0;
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Compare a plain text password with a hashed password.
   * @param {string} password - The plain text password to compare.
   * @param {string} hashedPassword - The hashed password to compare against.
   * @returns {Promise<boolean>} True if the passwords match, false otherwise.
   */
  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
