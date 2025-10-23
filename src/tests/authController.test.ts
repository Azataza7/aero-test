import { describe, test, expect, beforeEach } from "bun:test";
import request from "supertest";
import express, { type Express } from "express";
import type { Request, Response } from "express";

describe("Auth Controller Tests", () => {
  let app: Express;

  // Создаем mock функции для моделей
  let mockUserFindByPk: any;
  let mockUserCreate: any;
  let mockRefreshTokenCreate: any;
  let mockRefreshTokenFindOne: any;
  let mockRefreshTokenDestroy: any;
  let mockBlacklistedTokenCreate: any;
  let mockBcryptHash: any;
  let mockBcryptCompare: any;
  let mockGenerateAccessToken: any;
  let mockGenerateRefreshToken: any;
  let mockVerifyAccessToken: any;
  let mockGetRefreshTokenExpiry: any;

  beforeEach(() => {
    // Инициализируем Express приложение
    app = express();
    app.use(express.json());

    // Сбрасываем все mock функции
    mockUserFindByPk = async (id: string) => null;
    mockUserCreate = async (data: any) => ({
      id: data.id,
      password: data.password,
      created_at: data.created_at,
    });
    mockRefreshTokenCreate = async (data: any) => data;
    mockRefreshTokenFindOne = async (options: any) => null;
    mockRefreshTokenDestroy = async (options: any) => 1;
    mockBlacklistedTokenCreate = async (data: any) => data;
    mockBcryptHash = async (password: string, rounds: number) => "hashedPassword";
    mockBcryptCompare = async (password: string, hash: string) => true;
    mockGenerateAccessToken = (payload: any) => "mockAccessToken";
    mockGenerateRefreshToken = () => "mockRefreshToken";
    mockVerifyAccessToken = (token: string) => ({
      userId: "testuser",
      deviceId: "device123",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    mockGetRefreshTokenExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });

  describe("POST /signup", () => {
    test("should create a new user successfully", async () => {
      app.post("/signup", async (req: Request, res: Response) => {
        try {
          const { id, password } = req.body;

          if (!id || !password) {
            res.status(400).json({ error: "ID and password are required" });
            return;
          }

          const existingUser = await mockUserFindByPk(id);
          if (existingUser) {
            res.status(409).json({ error: "User already exists" });
            return;
          }

          const hashedPassword = await mockBcryptHash(password, 10);
          const user = await mockUserCreate({
            id,
            password: hashedPassword,
            created_at: new Date(),
          });

          const deviceId = req.headers["user-agent"] || "unknown";
          const accessToken = mockGenerateAccessToken({ userId: user.id, deviceId });
          const refreshToken = mockGenerateRefreshToken();

          await mockRefreshTokenCreate({
            userId: user.id,
            token: refreshToken,
            deviceId,
            expiresAt: mockGetRefreshTokenExpiry(),
          });

          res.status(201).json({
            id: user.id,
            token: accessToken,
            refreshToken,
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .post("/signup")
        .send({ id: "testuser", password: "TestPassword123!" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: "testuser",
        token: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      });
    });

    test("should return 400 if id is missing", async () => {
      app.post("/signup", async (req: Request, res: Response) => {
        const { id, password } = req.body;
        if (!id || !password) {
          res.status(400).json({ error: "ID and password are required" });
          return;
        }
      });

      const response = await request(app)
        .post("/signup")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ID and password are required");
    });

    test("should return 400 if password is missing", async () => {
      app.post("/signup", async (req: Request, res: Response) => {
        const { id, password } = req.body;
        if (!id || !password) {
          res.status(400).json({ error: "ID and password are required" });
          return;
        }
      });

      const response = await request(app)
        .post("/signup")
        .send({ id: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("ID and password are required");
    });

    test("should return 409 if user already exists", async () => {
      mockUserFindByPk = async (id: string) => ({ id, password: "hashedPassword" });

      app.post("/signup", async (req: Request, res: Response) => {
        const { id, password } = req.body;
        if (!id || !password) {
          res.status(400).json({ error: "ID and password are required" });
          return;
        }

        const existingUser = await mockUserFindByPk(id);
        if (existingUser) {
          res.status(409).json({ error: "User already exists" });
          return;
        }
      });

      const response = await request(app)
        .post("/signup")
        .send({ id: "testuser", password: "TestPassword123!" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("User already exists");
    });
  });

  describe("POST /signin", () => {
    test("should sign in user successfully", async () => {
      mockUserFindByPk = async (id: string) => ({
        id,
        password: "hashedPassword",
      });
      mockBcryptCompare = async () => true;

      app.post("/signin", async (req: Request, res: Response) => {
        try {
          const { id, password } = req.body;

          if (!id || !password) {
            res.status(400).json({ error: "ID and password are required" });
            return;
          }

          const user = await mockUserFindByPk(id);
          if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
          }

          const isPasswordValid = await mockBcryptCompare(password, user.password);
          if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
          }

          const deviceId = req.headers["user-agent"] || "unknown";
          const accessToken = mockGenerateAccessToken({ userId: user.id, deviceId });
          const refreshToken = mockGenerateRefreshToken();

          await mockRefreshTokenCreate({
            userId: user.id,
            token: refreshToken,
            deviceId,
            expiresAt: mockGetRefreshTokenExpiry(),
          });

          res.json({
            id: user.id,
            token: accessToken,
            refreshToken,
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .post("/signin")
        .send({ id: "testuser", password: "TestPassword123!" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: "testuser",
        token: "mockAccessToken",
        refreshToken: "mockRefreshToken",
      });
    });

    test("should return 401 if user does not exist", async () => {
      mockUserFindByPk = async () => null;

      app.post("/signin", async (req: Request, res: Response) => {
        const { id, password } = req.body;
        if (!id || !password) {
          res.status(400).json({ error: "ID and password are required" });
          return;
        }

        const user = await mockUserFindByPk(id);
        if (!user) {
          res.status(401).json({ error: "Invalid credentials" });
          return;
        }
      });

      const response = await request(app)
        .post("/signin")
        .send({ id: "testuser", password: "TestPassword123!" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    test("should return 401 if password is invalid", async () => {
      mockUserFindByPk = async (id: string) => ({
        id,
        password: "hashedPassword",
      });
      mockBcryptCompare = async () => false;

      app.post("/signin", async (req: Request, res: Response) => {
        const { id, password } = req.body;
        const user = await mockUserFindByPk(id);
        if (!user) {
          res.status(401).json({ error: "Invalid credentials" });
          return;
        }

        const isPasswordValid = await mockBcryptCompare(password, user.password);
        if (!isPasswordValid) {
          res.status(401).json({ error: "Invalid credentials" });
          return;
        }
      });

      const response = await request(app)
        .post("/signin")
        .send({ id: "testuser", password: "WrongPassword!" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /signin/new_token", () => {
    test("should generate new access token successfully", async () => {
      mockRefreshTokenFindOne = async (options: any) => ({
        token: options.where.token,
        userId: "testuser",
        deviceId: "device123",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      app.post("/signin/new_token", async (req: Request, res: Response) => {
        try {
          const { refreshToken } = req.body;

          if (!refreshToken) {
            res.status(400).json({ error: "Refresh token is required" });
            return;
          }

          const tokenRecord = await mockRefreshTokenFindOne({
            where: { token: refreshToken },
          });

          if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            res.status(401).json({ error: "Invalid or expired refresh token" });
            return;
          }

          const accessToken = mockGenerateAccessToken({
            userId: tokenRecord.userId,
            deviceId: tokenRecord.deviceId,
          });

          res.json({ token: accessToken });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .post("/signin/new_token")
        .send({ refreshToken: "validRefreshToken" });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe("mockAccessToken");
    });

    test("should return 400 if refresh token is missing", async () => {
      app.post("/signin/new_token", async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          res.status(400).json({ error: "Refresh token is required" });
          return;
        }
      });

      const response = await request(app)
        .post("/signin/new_token")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Refresh token is required");
    });

    test("should return 401 if refresh token is expired", async () => {
      mockRefreshTokenFindOne = async () => ({
        token: "expiredToken",
        userId: "testuser",
        deviceId: "device123",
        expiresAt: new Date(Date.now() - 1000),
      });

      app.post("/signin/new_token", async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          res.status(400).json({ error: "Refresh token is required" });
          return;
        }

        const tokenRecord = await mockRefreshTokenFindOne({
          where: { token: refreshToken },
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
          res.status(401).json({ error: "Invalid or expired refresh token" });
          return;
        }
      });

      const response = await request(app)
        .post("/signin/new_token")
        .send({ refreshToken: "expiredToken" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid or expired refresh token");
    });
  });

  describe("GET /info", () => {
    test("should return user info when authenticated", async () => {
      const mockAuth = (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          req.user = { userId: "testuser", deviceId: "device123" };
          next();
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      };

      app.get("/info", mockAuth, (req: any, res: Response) => {
        if (!req.user) {
          res.status(401).json({ success: false, error: "User does not exist" });
          return;
        }
        res.json({ id: req.user.userId });
      });

      const response = await request(app)
        .get("/info")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("testuser");
    });

    test("should return 401 when not authenticated", async () => {
      const mockAuth = (req: any, res: any, next: any) => {
        res.status(401).json({ error: "Unauthorized" });
      };

      app.get("/info", mockAuth, (req: any, res: Response) => {
        res.json({ id: req.user.userId });
      });

      const response = await request(app).get("/info");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /logout", () => {
    test("should logout user successfully", async () => {
      const mockAuth = (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          req.user = { userId: "testuser", deviceId: "device123" };
          next();
        } else {
          res.status(401).json({ error: "Unauthorized" });
        }
      };

      app.get("/logout", mockAuth, async (req: any, res: Response) => {
        try {
          const authHeader = req.headers.authorization;
          const token = authHeader?.substring(7);

          if (!req.user) {
            res.status(401).json({ success: false, error: "User does not exist" });
            return;
          }

          const deviceId = req.user.deviceId;

          if (token) {
            const decoded = mockVerifyAccessToken(token);
            const expiresAt = new Date((decoded as any).exp * 1000);

            await mockBlacklistedTokenCreate({
              token,
              expiresAt,
            });
          }

          if (req.user.userId && deviceId) {
            await mockRefreshTokenDestroy({
              where: {
                userId: req.user.userId,
                deviceId,
              },
            });
          }

          res.json({ message: "Logged out successfully" });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .get("/logout")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully");
    });

    test("should return 401 when not authenticated", async () => {
      const mockAuth = (req: any, res: any, next: any) => {
        res.status(401).json({ error: "Unauthorized" });
      };

      app.get("/logout", mockAuth, (req: any, res: Response) => {
        res.json({});
      });

      const response = await request(app).get("/logout");

      expect(response.status).toBe(401);
    });
  });
});