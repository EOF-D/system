import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Config } from "../config/config";

// Extend the Express Request interface to include a user property.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to protect routes.
 * Verifies the JWT token in the Authorization header.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header.
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists.
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });

      return;
    }

    try {
      // Verify the token.
      const decoded = jwt.verify(
        token,
        Config.jwtSecret
      ) as Express.Request["user"];

      // Add user data to request object.
      req.user = decoded;

      // Call next function to proceed.
      next();
    } catch (error) {
      console.error("JWT verification error:", error);
      res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Middleware to check if user has admin role.
 * Must be used after the protect middleware.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
  // First make sure we have a user from the protect middleware.
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Not authorized, no user information",
    });

    return;
  }

  // Then check if user has admin role.
  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized, admin access required",
    });
  }
};

export { adminOnly, protect };
