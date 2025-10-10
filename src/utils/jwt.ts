import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export interface TokenPayload {
  id: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const secret = JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is required");
    throw new Error("Internal server error");
  }
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): TokenPayload {
  const secret = JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is required");
    throw new Error("Internal server error");
  }

  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
