import { Config } from "@server/config/config";
import { logger } from "@shared/utils/logger";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Checks if the user has the required role.
 * @param {Request} req - Express request object.
 * @param {string} role - The role to check against.
 * @return {boolean} - Returns true if the user has the required role, false otherwise.
 */
const checkRole = (req: Request, role: string): boolean => {
  // Check if user exists in request object.
  if (!req.user) {
    return false;
  }

  // Check if user has the required role.
  return req.user.role === role;
};

/**
 * Verifies the JWT token in the Authorization header.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      req.user = decoded;

      // Call next function to proceed.
      next();
    } catch (error) {
      logger.error(`Error while trying to verify token: ${error}`);
      res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Verifies the user calling is a professor.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export const professorOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (checkRole(req, "professor")) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized, professor role required",
    });
  }
};

/**
 * Verifies the user calling is a admin.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export const adminOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (checkRole(req, "admin")) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized, admin role required",
    });
  }
};
