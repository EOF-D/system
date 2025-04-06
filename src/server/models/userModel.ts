import bcrypt from "bcryptjs";
import { getDb } from "../config/database";

/**
 * User data for the database.
 */
export interface User {
  /**
   * Unique identifier for the user.
   */
  id: number;

  /**
   * Name of the user.
   */
  name: string;

  /**
   * Email address of the user.
   */
  email: string;

  /**
   * Hashed password of the user.
   */
  password?: string;

  /**
   * Role of the user (e.g., admin, user).
   */
  role: string;

  /**
   * Timestamp when the user was created.
   */
  created_at: string;

  /**
   * Timestamp when the user was last updated.
   */
  updated_at: string;
}

/**
 * Input data for creating a new user.
 */
export interface CreateUserInput {
  /**
   * Name of the user.
   */
  name: string;

  /**
   * Email address of the user.
   */
  email: string;

  /**
   * Password of the user.
   */
  password: string;

  /**
   * Role of the user (e.g., admin, user).
   */
  role?: string;
}

/**
 * Input data for updating an existing user.
 */
export interface UpdateUserInput {
  /**
   * Name of the user.
   */
  name?: string;

  /**
   * Email address of the user.
   */
  email?: string;

  /**
   * Password of the user.
   */
  password?: string;

  /**
   * Role of the user (e.g., admin, user).
   */
  role?: string;
}

/**
 * User model for interacting with the database.
 * This model provides methods to create, read, update, and delete users.
 */
export class UserModel {
  /**
   * Get all users from the database.
   * @returns {Promise<Omit<User, 'password'>[]>} List of users without passwords.
   */
  static async findAll(): Promise<Omit<User, "password">[]> {
    const db = await getDb();

    try {
      const users = await db.all<Omit<User, "password">[]>(`
        SELECT id, name, email, role, created_at, updated_at 
        FROM users
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
        SELECT id, name, email, role, created_at, updated_at 
        FROM users 
        WHERE id = ?
      `,
        id
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
        SELECT * FROM users WHERE email = ?
      `,
        email
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
      // Hash the password before storing it.
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Set default role to 'user' if not provided.
      const role = userData.role || "user";

      // Insert the new user into the database.
      const result = await db.run(
        `
        INSERT INTO users (name, email, password, role) 
        VALUES (?, ?, ?, ?)
      `,
        [userData.name, userData.email, hashedPassword, role]
      );

      // Get the ID of the newly created user.
      const id = result.lastID;

      // Get the created user without password.
      const newUser = await this.findById(id!);
      return newUser!;
    } finally {
      await db.close();
    }
  }

  /**
   * Update an existing user in the database.
   * @param {number} id - The ID of the user to update.
   * @param {UpdateUserInput} updateData  - The data to update the user with.
   * @returns
   */
  static async update(
    id: number,
    updateData: UpdateUserInput
  ): Promise<Omit<User, "password"> | null> {
    const db = await getDb();
    try {
      // Start building the query.
      let query = "UPDATE users SET ";
      const values: any[] = [];

      // Add each field to update.
      if (updateData.name) {
        query += "name = ?, ";
        values.push(updateData.name);
      }

      if (updateData.email) {
        query += "email = ?, ";
        values.push(updateData.email);
      }

      if (updateData.password) {
        // Hash the new password before storing it.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updateData.password, salt);
        query += "password = ?, ";
        values.push(hashedPassword);
      }

      if (updateData.role) {
        query += "role = ?, ";
        values.push(updateData.role);
      }

      // Always update the updated_at timestamp.
      query += "updated_at = CURRENT_TIMESTAMP ";

      // Add the WHERE clause.
      query += "WHERE id = ?";
      values.push(id);

      // Run the query.
      await db.run(query, values);

      // Get the updated user.
      return await this.findById(id);
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
      const result = await db.run("DELETE FROM users WHERE id = ?", id);
      return result.changes! > 0;
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
