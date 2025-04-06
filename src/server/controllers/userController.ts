import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { Config } from "../config/config";
import { UserModel } from "../models/userModel";

/**
 * Generate a JWT token.
 * @param {number} id - User ID to use in the token payload.
 * @param {string} role - User role to use in the token payload.
 * @return {string} - Generated JWT token.
 */
const generateToken = (id: number, role: string) => {
  return jwt.sign({ id, role }, Config.jwtSecret, {
    expiresIn: Config.jwtExpiresIn as StringValue,
  });
};

/**
 * Get all users.
 * @route GET /api/users
 * @access Admin
 */
export const getUsers = async (_: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get a user by ID.
 * @route GET /api/users/:id
 * @access Admin
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
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get the current user's profile.
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Create a new user.
 * @route POST /api/users
 * @access Public
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists.
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create the user.
    const newUser = await UserModel.create({ name, email, password, role });

    // Generate a token.
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      data: {
        ...newUser,
        token,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a user.
 * @route PUT /api/users/:id
 * @access Admin or Private (for own profile)
 */
export const updateUser = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Not authorized" });
    return;
  }

  try {
    // Determine which ID to use.
    // or from the JWT token (user updating themselves)
    let userId: number;

    if (req.params.id) {
      // Admin updating another user.
      userId = parseInt(req.params.id);
    } else {
      // Updating own profile.
      userId = req.user.id;
    }

    const { name, email, password, role } = req.body;

    // Check if user exists.
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // If user is updating their own profile, they can't change their role.
    // Only admins can change roles.
    let updateData: any = { name, email, password };
    if (req.user.role === "admin" && role) {
      updateData.role = role;
    }

    // Update the user.
    const updatedUser = await UserModel.update(userId, updateData);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
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
    console.error("Error deleting user:", error);
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
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
