import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import request from "supertest";
import express, { type Express } from "express";
import { User } from "../../models/User";
import { RefreshToken } from "../../models/RefreshToken";
import { sequelize } from "../../config/database.ts";
import { BlacklistedToken } from "../../models/BlacklistedToken.ts";
import AuthRouter from "../../routes/authRoutes.ts";

/**
 * РЕАЛЬНЫЕ ИНТЕГРАЦИОННЫЕ ТЕСТЫ
 * Используют реальную базу данных и контроллеры
 *
 * ВАЖНО: Эти тесты требуют настроенную тестовую БД!
 * Перед запуском создайте .env.test с настройками тестовой БД
 */

describe("Auth Controller Integration Tests (REAL)", () => {
  let app: Express;

  beforeAll(async () => {
    // Подключаемся к тестовой БД
    await sequelize.authenticate();

    // ВАЖНО: При force: true Sequelize пытается удалить таблицы
    // Но если есть foreign keys, нужно удалять в правильном порядке

    // Отключаем проверку foreign keys временно для пересоздания таблиц
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Теперь можем безопасно удалить все таблицы
    await sequelize.query('DROP TABLE IF EXISTS `files`');
    await sequelize.query('DROP TABLE IF EXISTS `refresh_tokens`');
    await sequelize.query('DROP TABLE IF EXISTS `blacklisted_tokens`');
    await sequelize.query('DROP TABLE IF EXISTS `users`');

    // Включаем обратно проверку foreign keys
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Создаем таблицы в правильном порядке (родитель -> дети)
    await User.sync();
    await RefreshToken.sync();
    await BlacklistedToken.sync();
  });

  afterAll(async () => {
    // Очищаем БД после тестов
    // КРИТИЧЕСКИ ВАЖНО: Сначала удаляем ДОЧЕРНИЕ записи, потом РОДИТЕЛЬСКИЕ
    try {
      await RefreshToken.destroy({ where: {}, force: true });
      await BlacklistedToken.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      // Закрываем соединение только в самом конце
      await sequelize.close();
    }
  });

  beforeEach(async () => {
    // Очищаем данные перед каждым тестом
    // КРИТИЧЕСКИ ВАЖНО: Сначала удаляем ДОЧЕРНИЕ записи, потом РОДИТЕЛЬСКИЕ
    await RefreshToken.destroy({ where: {}, force: true });
    await BlacklistedToken.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Создаем Express приложение с реальными роутами
    app = express();
    app.use(express.json());
    app.use("/auth", AuthRouter);
  });

  describe("POST /auth/signup - REAL DATABASE", () => {
    test("should create user in real database", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          id: "realuser@test.com",
          password: "RealPassword123!",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id", "realuser@test.com");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");

      // Проверяем что пользователь реально создан в БД
      const user = await User.findByPk("realuser@test.com");
      expect(user).not.toBeNull();
      expect(user?.id).toBe("realuser@test.com");

      // Проверяем что refresh token создан
      const refreshTokens = await RefreshToken.findAll({
        where: { userId: "realuser@test.com" },
      });
      expect(refreshTokens.length).toBe(1);
    });

    test("should hash password in real database", async () => {
      await request(app)
        .post("/auth/signup")
        .send({
          id: "testuser@test.com",
          password: "PlainPassword123",
        });

      const user = await User.findByPk("testuser@test.com");
      expect(user?.password).not.toBe("PlainPassword123");
      expect(user?.password.length).toBeGreaterThan(50); // bcrypt hash длиннее
    });

    test("should prevent duplicate users in real database", async () => {
      // Создаем первого пользователя
      await request(app)
        .post("/auth/signup")
        .send({
          id: "duplicate@test.com",
          password: "Password123!",
        });

      // Пытаемся создать дубликат
      const response = await request(app)
        .post("/auth/signup")
        .send({
          id: "duplicate@test.com",
          password: "AnotherPassword123!",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("User already exists");

      // Проверяем что в БД только один пользователь
      const users = await User.findAll({ where: { id: "duplicate@test.com" } });
      expect(users.length).toBe(1);
    });

    test("should validate required fields", async () => {
      const response1 = await request(app)
        .post("/auth/signup")
        .send({ password: "Password123!" });

      expect(response1.status).toBe(400);

      const response2 = await request(app)
        .post("/auth/signup")
        .send({ id: "testuser@test.com" });

      expect(response2.status).toBe(400);
    });
  });

  describe("POST /auth/signin - REAL DATABASE", () => {
    beforeEach(async () => {
      // Создаем тестового пользователя
      await request(app)
        .post("/auth/signup")
        .send({
          id: "loginuser@test.com",
          password: "LoginPass123!",
        });
    });

    test("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/auth/signin")
        .send({
          id: "loginuser@test.com",
          password: "LoginPass123!",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", "loginuser@test.com");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");

      // Проверяем что refresh token создан
      const tokens = await RefreshToken.findAll({
        where: { userId: "loginuser@test.com" },
      });
      expect(tokens.length).toBeGreaterThan(0);
    });

    test("should reject wrong password", async () => {
      const response = await request(app)
        .post("/auth/signin")
        .send({
          id: "loginuser@test.com",
          password: "WrongPassword123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    test("should reject non-existent user", async () => {
      const response = await request(app)
        .post("/auth/signin")
        .send({
          id: "nonexistent@test.com",
          password: "Password123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    test("should create new refresh token on each login", async () => {
      // Первый логин
      await request(app)
        .post("/auth/signin")
        .send({
          id: "loginuser@test.com",
          password: "LoginPass123!",
        });

      // Второй логин
      await request(app)
        .post("/auth/signin")
        .send({
          id: "loginuser@test.com",
          password: "LoginPass123!",
        });

      // Проверяем что создано несколько токенов
      const tokens = await RefreshToken.findAll({
        where: { userId: "loginuser@test.com" },
      });
      expect(tokens.length).toBeGreaterThan(1);
    });
  });

  describe("POST /auth/signin/new_token - REAL DATABASE", () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Создаем пользователя и получаем refresh token
      const response = await request(app)
        .post("/auth/signup")
        .send({
          id: "tokenuser@test.com",
          password: "TokenPass123!",
        });

      refreshToken = response.body.refreshToken;
    });

    test("should generate new access token with valid refresh token", async () => {
      const response = await request(app)
        .post("/auth/signin/new_token")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");

      // Проверяем что refresh token существует в БД
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken },
      });
      expect(tokenRecord).not.toBeNull();
    });

    test("should reject invalid refresh token", async () => {
      const response = await request(app)
        .post("/auth/signin/new_token")
        .send({ refreshToken: "invalid-token-123" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid or expired refresh token");
    });

    test("should reject expired refresh token", async () => {
      // Создаем истекший токен
      await RefreshToken.create({
        userId: "tokenuser@test.com",
        token: "expired-token",
        deviceId: "test-device",
        expiresAt: new Date(Date.now() - 1000), // В прошлом
      });

      const response = await request(app)
        .post("/auth/signin/new_token")
        .send({ refreshToken: "expired-token" });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /auth/info - REAL DATABASE", () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          id: "infouser@test.com",
          password: "InfoPass123!",
        });

      accessToken = response.body.token;
    });

    test("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/auth/info")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", "infouser@test.com");
    });

    test("should reject request without token", async () => {
      const response = await request(app).get("/auth/info");

      expect(response.status).toBe(401);
    });

    test("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/auth/info")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /auth/logout - REAL DATABASE", () => {
    let accessToken: string;
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          id: "logoutuser@test.com",
          password: "LogoutPass123!",
        });

      accessToken = response.body.token;
      refreshToken = response.body.refreshToken;
      userId = response.body.id;
    });

    test("should logout and blacklist token", async () => {
      const response = await request(app)
        .get("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully");

      // Проверяем что токен добавлен в blacklist
      const blacklisted = await BlacklistedToken.findOne({
        where: { token: accessToken },
      });
      expect(blacklisted).not.toBeNull();
    });

    test("should delete refresh tokens on logout", async () => {
      await request(app)
        .get("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      // Проверяем что refresh токены удалены
      const tokens = await RefreshToken.findAll({
        where: { userId, token: refreshToken },
      });
      expect(tokens.length).toBe(0);
    });

    test("should reject logout without token", async () => {
      const response = await request(app).get("/auth/logout");

      expect(response.status).toBe(401);
    });
  });

  describe("Complete User Flow - REAL DATABASE", () => {
    test("should handle complete signup -> login -> refresh -> logout flow", async () => {
      // 1. Signup
      const signupRes = await request(app)
        .post("/auth/signup")
        .send({
          id: "flowuser@test.com",
          password: "FlowPass123!",
        });

      expect(signupRes.status).toBe(201);
      const firstToken = signupRes.body.token;
      const firstRefreshToken = signupRes.body.refreshToken;

      // 2. Login снова
      const loginRes = await request(app)
        .post("/auth/signin")
        .send({
          id: "flowuser@test.com",
          password: "FlowPass123!",
        });

      expect(loginRes.status).toBe(200);
      const secondToken = loginRes.body.token;

      // 3. Получить информацию
      const infoRes = await request(app)
        .get("/auth/info")
        .set("Authorization", `Bearer ${secondToken}`);

      expect(infoRes.status).toBe(200);
      expect(infoRes.body.id).toBe("flowuser@test.com");

      // 4. Обновить токен
      const refreshRes = await request(app)
        .post("/auth/signin/new_token")
        .send({ refreshToken: firstRefreshToken });

      expect(refreshRes.status).toBe(200);
      const newToken = refreshRes.body.token;

      // 5. Использовать новый токен
      const infoRes2 = await request(app)
        .get("/auth/info")
        .set("Authorization", `Bearer ${newToken}`);

      expect(infoRes2.status).toBe(200);

      // 6. Logout
      const logoutRes = await request(app)
        .get("/auth/logout")
        .set("Authorization", `Bearer ${newToken}`);

      expect(logoutRes.status).toBe(200);

      // 7. Проверяем что токен в blacklist
      const blacklisted = await BlacklistedToken.findOne({
        where: { token: newToken },
      });
      expect(blacklisted).not.toBeNull();
    });
  });

  describe("Security Tests - REAL DATABASE", () => {
    test("should not store plain text passwords", async () => {
      const plainPassword = "MySecretPassword123!";

      await request(app)
        .post("/auth/signup")
        .send({
          id: "secureuser@test.com",
          password: plainPassword,
        });

      const user = await User.findByPk("secureuser@test.com");
      expect(user?.password).not.toBe(plainPassword);
      expect(user?.password).toContain("$2"); // bcrypt hash starts with $2
    });

    test("should not allow SQL injection in user id", async () => {
      // Временно отключаем console.error для этого теста
      const originalError = console.error;
      console.error = () => {};

      try {
        const response = await request(app)
          .post("/auth/signup")
          .send({
            id: "'; DROP TABLE users; --",
            password: "Password123!",
          });

        // Должно вернуть ошибку валидации (400 или 500)
        // но НЕ должно удалить таблицу
        expect(response.status).toBeGreaterThanOrEqual(400);

        const users = await User.findAll();
        // Таблица должна существовать
        expect(users).toBeDefined();
      } finally {
        // Восстанавливаем console.error
        console.error = originalError;
      }
    });

    test("should handle concurrent signups correctly", async () => {
      const signupPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/auth/signup")
          .send({
            id: `concurrent${i}@test.com`,
            password: "Password123!",
          })
      );

      const results = await Promise.all(signupPromises);

      // Все должны успешно создаться
      results.forEach((res) => {
        expect(res.status).toBe(201);
      });

      // Проверяем что все 5 пользователей созданы
      const users = await User.findAll();
      expect(users.length).toBeGreaterThanOrEqual(5);
    });
  });
});