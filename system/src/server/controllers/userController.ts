import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { Config } from "../config/config";
import { UserModel } from "../models/userModel";
import { CreateUserInput, UpdateUserInput } from "../types/models/user";
import { logger } from "../utils/logger";

/**
 * Generate a JWT token.
 * @param {number} id - User ID to use in the token payload.
 * @param {string} role - User role to use in the token payload.
 * @return {string} - Generated JWT token.
 */
export const generateToken = (id: number, role: string) => {
  return jwt.sign({ id, role }, Config.jwtSecret, {
    expiresIn: Config.jwtExpiresIn as StringValue,
  });
};

/**
 * Create a new user.
 * @route POST /api/users
 * @access Public
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, profile } = req.body;

    // Check if user with this email already exists.
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });

      return;
    }

    // Create the user.
    const userData: CreateUserInput = {
      email,
      password,
      role,
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        major: profile.major,
        graduation_year: profile.graduation_year,
      },
    };

    const newUser = await UserModel.create(userData);
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      data: {
        ...newUser,
        token,
      },
    });
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a user.
 * @route PUT /api/users/:id
 * @access Admin or Private (for own profile)
 */
export const updateUser = async (req: Request, res: Response) => {
  let updateSelf: boolean = false;

  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    // Determine which ID to use.
    let userId: number;

    if (req.params.id) {
      // Admin updating another user.
      userId = parseInt(req.params.id);
    } else {
      // Updating own profile.
      userId = req.user.id;
      updateSelf = true;
    }

    const { email, password, role, profile } = req.body;

    // Check if user exists.
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // If user is updating their own profile, they can't change their role.
    // Only admins can change roles.
    const updateData: UpdateUserInput = {
      email,
      password,
      profile,
    };

    if (req.user.role === "admin" && role) {
      updateData.role = role;
    }

    // Update the user.
    const updatedUser = await UserModel.update(userId, updateData);
    if (!updatedUser) {
      res
        .status(500)
        .json({ success: false, message: "Failed to update user" });

      return;
    }

    // Generate a new token if the user is updating their own profile.
    let data = { ...updatedUser, token: "" };
    if (updateSelf) {
      data = {
        ...data,
        token: generateToken(updatedUser.id, updatedUser.role),
      };
    }

    res.status(200).json({ success: true, data: data });
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a user.
 * @route DELETE /api/users/:id
 * @access Admin
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    // Check if user exists.
    const id = parseInt(req.params.id);
    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Delete the user.
    const deleted = await UserModel.delete(id);
    if (deleted) {
      res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete user" });
    }
  } catch (error) {
    logger.error(`Error deleting user: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Login a user.
 * @route POST /api/users/login
 * @access Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    logger.info(`Logging in user: ${email}`);

    // Check if user exists.
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    // Check if password matches.
    const isMatch = await UserModel.comparePassword(password, user.password!);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    // Generate token.
    const token = generateToken(user.id, user.role);

    // Return user without password.
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        ...userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    logger.error(`Error logging in: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get all users.
 * @route GET /api/users
 * @access Admin
 */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await UserModel.findAll() });
  } catch (error) {
    logger.error(`Error getting users: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get a user by ID.
 * @route GET /api/users/:id
 * @access Admin or Private (for own profile)
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error getting user: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get current user profile.
 * @route GET /api/users/me
 * @access Private
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error getting current user: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
