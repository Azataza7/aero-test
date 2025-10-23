import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { BlacklistedToken } from "../models/BlacklistedToken.ts";

export interface UserPayload {
  userId: string;
  deviceId: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const blacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (blacklisted) {
      res.status(401).json({ error: "Token has been revoked" });
      return;
    }

    const decoded = verifyAccessToken(token);
    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  }
};
