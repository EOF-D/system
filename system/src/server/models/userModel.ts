import bcrypt from "bcryptjs";
import { getDb } from "../config/database";
import {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "../../shared/types/models/user";
import { logger } from "../../shared/utils/logger";

/**
 * Handles user-related database operations.
 */
export class UserModel {
  /**
   * Columns to select from the users table.
   * @type {string}
   * @private
   */
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

  /**
   * Joins to use when querying users.
   * @type {string}
   * @private
   */
  private static USER_JOIN = `
    FROM users u JOIN profiles p ON u.profile_id = p.id
  `;

  /**
   * Create a new user in the database.
   * @param {CreateUserInput} userData - The data for the new user.
   * @returns {Promise<Omit<User, 'password'>>} The created user without password.
   */
  static async create(
    userData: CreateUserInput
  ): Promise<Omit<User, "password">> {
    logger.info(`Creating a new user: ${userData}`);
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

      // Get the created user without password.
      const newUser = await this.findById(userResult.lastID!);
      return newUser!;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error creating user: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Update an existing user in the database.
   * @param {number} id - The ID of the user to update.
   * @param {UpdateUserInput} updateData - The data to update the user with.
   * @returns {Promise<Omit<User, 'password'> | null>} The updated user without password or null if not found.
   */
  static async update(
    id: number,
    updateData: UpdateUserInput
  ): Promise<Omit<User, "password"> | null> {
    logger.info(`Updating user: ${id} data: ${updateData}`);
    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      // Get the current user to check if it exists.
      const currentUser = await this.findById(id);
      if (!currentUser) {
        await db.run("ROLLBACK");
        return null;
      }

      // Update profile if needed.
      if (updateData.profile) {
        const profileFields: string[] = [];
        const profileValues: any[] = [];

        if (updateData.profile.first_name) {
          profileFields.push("first_name = ?");
          profileValues.push(updateData.profile.first_name);
        }

        if (updateData.profile.last_name) {
          profileFields.push("last_name = ?");
          profileValues.push(updateData.profile.last_name);
        }

        if (updateData.profile.major !== undefined) {
          profileFields.push("major = ?");
          profileValues.push(updateData.profile.major);
        }

        if (updateData.profile.graduation_year !== undefined) {
          profileFields.push("graduation_year = ?");
          profileValues.push(updateData.profile.graduation_year);
        }

        // Only update profile if there are changes.
        if (profileFields.length > 0) {
          profileFields.push("updated_at = CURRENT_TIMESTAMP");
          profileValues.push(currentUser.profile_id);

          await db.run(
            `UPDATE profiles SET ${profileFields.join(", ")} WHERE id = ?`,
            profileValues
          );
        }
      }

      // Update user if needed.
      const userFields: string[] = [];
      const userValues: any[] = [];

      if (updateData.email) {
        userFields.push("email = ?");
        userValues.push(updateData.email);
      }

      if (updateData.password) {
        // Hash the new password before storing it.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updateData.password, salt);

        userFields.push("password = ?");
        userValues.push(hashedPassword);
      }

      if (updateData.role) {
        userFields.push("role = ?");
        userValues.push(updateData.role);
      }

      // Only update user if there are changes.
      if (userFields.length > 0) {
        userValues.push(id);

        await db.run(
          `UPDATE users SET ${userFields.join(", ")} WHERE id = ?`,
          userValues
        );
      }

      // Get the updated user.
      await db.run("COMMIT");
      return await this.findById(id);
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error updating user: ${error}`);
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
    logger.info(`Deleting user: ${id}`);
    const db = await getDb();

    try {
      await db.run("BEGIN TRANSACTION");

      // Find the user to get the profile_id.
      const user = await UserModel.findById(id);
      if (!user) {
        await db.run("ROLLBACK");
        return false;
      }

      // Delete the user first..
      const userResult = await db.run("DELETE FROM users WHERE id = ?", [id]);

      // If user was successfully deleted, also delete the profile.
      if (userResult.changes! > 0) {
        await db.run("DELETE FROM profiles WHERE id = ?", [user.profile_id]);
      }

      await db.run("COMMIT");
      return userResult.changes! > 0;
    } catch (error) {
      await db.run("ROLLBACK");
      logger.error(`Error deleting user: ${error}`);
      throw error;
    } finally {
      await db.close();
    }
  }

  /**
   * Get all users from the database.
   * @returns {Promise<Omit<User, 'password'>[]>} List of users without passwords.
   */
  static async findAll(): Promise<Omit<User, "password">[]> {
    logger.info("Fetching all users from the database.");
    const db = await getDb();

    try {
      const users = await db.all<Omit<User, "password">[]>(`
        SELECT ${UserModel.USER_COLUMNS}
        ${UserModel.USER_JOIN};
      `);

      return users;
    } catch (error) {
      logger.error(`Error fetching users: ${error}`);
      throw error;
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
    logger.info(`Fetching user: ${id}`);
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
    } catch (error) {
      logger.error(`Error fetching user: ${error}`);
      throw error;
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
    logger.info(`Fetching user by email: ${email}`);
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
    } catch (error) {
      logger.error(`Error fetching user: ${error}`);
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
