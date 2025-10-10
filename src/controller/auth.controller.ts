import { Request, Response } from "express";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { email, name, picture, googleId } = req.body;

    // Validation
    if (!email || !name || !googleId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, name, googleId",
      });
    }

    // Find user by email OR googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      console.log("Existing user found:", user._id);

      // Update user data
      user.name = name;
      user.picture = picture;
      user.googleId = googleId;
      user.lastLogin = new Date();

      await user.save();
    } else {
      // NEW USER - Create account
      console.log("Creating new user for:", email);

      user = new User({
        email,
        name,
        picture,
        googleId,
        role: "student",
        password: `google-oauth-${Date.now()}-${Math.random()}`,
        lastLogin: new Date(),
      });

      await user.save();
      console.log("New user created:", user._id);
    }

    const token = generateToken({
      id: user.id.toString(),
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        token,
      },
    });

    console.log("Google auth request:", { email, googleId });
  } catch (error: any) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Authentication failed",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
