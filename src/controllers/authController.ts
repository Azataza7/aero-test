import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { BlacklistedToken } from "../models/BlacklistedToken.ts"; // ДОБАВИТЬ
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { type AuthenticatedRequest } from "../middleware/auth";

const SALT_ROUNDS = 10;

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      res.status(400).json({ error: "ID and password are required" });
      return;
    }

    const existingUser = await User.findByPk(id);
    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      id,
      password: hashedPassword,
      created_at: new Date(),
    });

    const deviceId = req.headers["user-agent"] || "unknown";
    const accessToken = generateAccessToken({ userId: user.id, deviceId });
    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      deviceId,
      expiresAt: getRefreshTokenExpiry(),
    });

    res.status(201).json({
      id: user.id,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      res.status(400).json({ error: "ID and password are required" });
      return;
    }

    const user = await User.findByPk(id);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const deviceId = req.headers["user-agent"] || "unknown";
    const accessToken = generateAccessToken({ userId: user.id, deviceId });
    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      deviceId,
      expiresAt: getRefreshTokenExpiry(),
    });

    res.json({
      id: user.id,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const newToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const accessToken = generateAccessToken({
      userId: tokenRecord.userId,
      deviceId: tokenRecord.deviceId,
    });

    res.json({ token: accessToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const info = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  res.json({ id: req.user.userId });
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    const deviceId = req.user.deviceId;

    if (token) {
      const decoded = verifyAccessToken(token);
      const expiresAt = new Date((decoded as any).exp * 1000);

      await BlacklistedToken.create({
        token,
        expiresAt,
      });
    }

    if (req.user.userId && deviceId) {
      await RefreshToken.destroy({
        where: {
          userId: req.user.userId,
          deviceId,
        },
      });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
