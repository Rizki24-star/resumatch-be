// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.js";

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const decoded = verifyToken(token);

    req.user = decoded;

    console.log("Authenticated user:", {
      id: req.user.id,
      email: req.user.email,
    });

    next();
  } catch (error: any) {
    if (error.message.includes("expired")) {
      return res.status(401).json({
        success: false,
        error: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

/**
 * Optional: Role-based authorization
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    next();
  };
};
