import express from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getCurrentUser,
  getUsers,
  loginUser,
  updateUser,
} from "../controllers/userController";
import { adminOnly, protect } from "../middleware/authMiddleware";

// This is the user router for the server.
const userRouter = express.Router();

/**
 * @route   POST /api/users
 * @desc    Register a new user.
 * @access  Public
 */
userRouter.post("/", createUser);

/**
 * @route   POST /api/users/login
 * @desc    Login a user and get token.
 * @access  Public
 */
userRouter.post("/login", loginUser);

// Protected routes - require authentication.
userRouter.use(protect);

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile.
 * @access  Private
 */
userRouter.get("/me", getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile.
 * @access  Private
 */
userRouter.put("/me", updateUser);

// Admin only routes.
userRouter.use(adminOnly);

/**
 * @route   GET /api/users
 * @desc    Get all users.
 * @access  Admin
 */
userRouter.get("/", getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID.
 * @access  Admin
 */
userRouter.get("/:id", getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update any user.
 * @access  Admin
 */
userRouter.put("/:id", updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user.
 * @access  Admin
 */
userRouter.delete("/:id", deleteUser);

export default userRouter;
