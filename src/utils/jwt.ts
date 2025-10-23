import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/envConfig.ts";

const JWT_SECRET = env.JWT_SECRET as string;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || "10m";

export interface JwtPayload {
  userId: string;
  deviceId: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  const days = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return new Date(Date.now() + days);
};
