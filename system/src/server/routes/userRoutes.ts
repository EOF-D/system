import express from "express";
import {
  createUser,
  deleteUser,
  getCurrentUser,
  getUserById,
  getUsers,
  loginUser,
  updateUser,
} from "../controllers/userController";
import { adminOnly, protect } from "../middleware/auth";

export const userRouter = express.Router();

/**
 * @route POST /api/users
 * @description Register a new user.
 * @access Public
 */
userRouter.post("/", createUser);

/**
 * @route POST /api/users/login
 * @description Login a user and get token.
 * @access Public
 */
userRouter.post("/login", loginUser);

// Protected routes - require authentication.
userRouter.use(protect);

/**
 * @route GET /api/users/me
 * @description Get current user's profile.
 * @access Private
 */
userRouter.get("/me", getCurrentUser);

/**
 * @route PUT /api/users/me
 * @description Update current user's profile.
 * @access Private
 */
userRouter.put("/me", updateUser);

// Admin only routes.
userRouter.use(adminOnly);

/**
 * @route GET /api/users
 * @description Get all users.
 * @access Admin
 */
userRouter.get("/", getUsers);

/**
 * @route GET /api/users/:id
 * @description Get user by ID.
 * @access Admin
 */
userRouter.get("/:id", getUserById);

/**
 * @route PUT /api/users/:id
 * @description Update any user.
 * @access Admin
 */
userRouter.put("/:id", updateUser);

/**
 * @route DELETE /api/users/:id
 * @description Delete a user.
 * @access Admin
 */
userRouter.delete("/:id", deleteUser);
