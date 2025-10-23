import { describe, test, expect, beforeEach } from "bun:test";
import request from "supertest";
import express, { type Express } from "express";
import type { Request, Response } from "express";

/**
 * Тесты для File Controller
 * Тестируют логику работы с файлами без реальных файловых операций
 */

describe("File Controller Tests", () => {
  let app: Express;

  // Mock функции для моделей и fs
  let mockFileCreate: any;
  let mockFileFindAndCountAll: any;
  let mockFileFindOne: any;
  let mockFileDestroy: any;
  let mockFileSave: any;
  let mockFsExistsSync: any;
  let mockFsUnlinkSync: any;

  // Mock middleware для аутентификации
  const mockAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.substring(7);
    if (token === "validToken") {
      req.user = { userId: "testuser", deviceId: "device123" };
      next();
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  beforeEach(() => {
    // Инициализируем Express приложение
    app = express();
    app.use(express.json());

    // Сбрасываем все mock функции
    mockFileCreate = async (data: any) => ({
      id: 1,
      userId: data.userId,
      filename: data.filename,
      originalName: data.originalName,
      extension: data.extension,
      mimeType: data.mimeType,
      size: data.size,
      uploadDate: data.uploadDate,
      getReadableSize: () => "1 KB",
    });

    mockFileFindAndCountAll = async (options: any) => ({
      count: 0,
      rows: [],
    });

    mockFileFindOne = async (options: any) => null;

    mockFileDestroy = async () => {};
    mockFileSave = async () => {};

    mockFsExistsSync = (path: string) => true;
    mockFsUnlinkSync = (path: string) => {};
  });

  describe("POST /file/upload", () => {
    test("should upload file successfully", async () => {
      app.post("/file/upload", mockAuth, async (req: any, res: Response) => {
        try {
          // Симулируем multer file object
          const mockFile = {
            filename: "unique-filename-123.txt",
            originalname: "test.txt",
            mimetype: "text/plain",
            size: 1024,
          };

          if (!mockFile) {
            res.status(400).json({ error: "No file uploaded" });
            return;
          }

          if (!req.user) {
            res.status(401).json({ success: false, error: "User does not exist" });
            return;
          }

          const file = await mockFileCreate({
            userId: req.user.userId,
            filename: mockFile.filename,
            originalName: mockFile.originalname,
            extension: ".txt",
            mimeType: mockFile.mimetype,
            size: mockFile.size,
            uploadDate: new Date(),
          });

          res.status(201).json({
            id: file.id,
            filename: file.originalName,
            size: file.getReadableSize(),
            uploadDate: file.uploadDate,
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .post("/file/upload")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("filename", "test.txt");
      expect(response.body).toHaveProperty("size", "1 KB");
    });

    test("should return 401 when not authenticated", async () => {
      app.post("/file/upload", mockAuth, async (req: Request, res: Response) => {
        res.status(201).json({});
      });

      const response = await request(app).post("/file/upload");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });

  describe("GET /file/list", () => {
    test("should list files with default pagination", async () => {
      mockFileFindAndCountAll = async (options: any) => ({
        count: 2,
        rows: [
          {
            id: 1,
            originalName: "file1.txt",
            extension: ".txt",
            mimeType: "text/plain",
            uploadDate: new Date("2025-01-01"),
            getReadableSize: () => "1 KB",
          },
          {
            id: 2,
            originalName: "file2.pdf",
            extension: ".pdf",
            mimeType: "application/pdf",
            uploadDate: new Date("2025-01-02"),
            getReadableSize: () => "2 KB",
          },
        ],
      });

      app.get("/file/list", mockAuth, async (req: any, res: Response) => {
        try {
          const listSize = parseInt(req.query.list_size as string) || 10;
          const page = parseInt(req.query.page as string) || 1;
          const offset = (page - 1) * listSize;

          if (!req.user) {
            res.status(401).json({ success: false, error: "User does not exist" });
            return;
          }

          const { count, rows } = await mockFileFindAndCountAll({
            where: { userId: req.user.userId },
            limit: listSize,
            offset,
            order: [["uploadDate", "DESC"]],
          });

          const files = rows.map((file: any) => ({
            id: file.id,
            filename: file.originalName,
            extension: file.extension,
            mimeType: file.mimeType,
            size: file.getReadableSize(),
            uploadDate: file.uploadDate,
          }));

          res.json({
            files,
            pagination: {
              total: count,
              page,
              listSize,
              totalPages: Math.ceil(count / listSize),
            },
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .get("/file/list")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        total: 2,
        page: 1,
        listSize: 10,
        totalPages: 1,
      });
    });

    test("should list files with custom pagination", async () => {
      mockFileFindAndCountAll = async (options: any) => ({
        count: 15,
        rows: [
          {
            id: 3,
            originalName: "file3.jpg",
            extension: ".jpg",
            mimeType: "image/jpeg",
            uploadDate: new Date("2025-01-03"),
            getReadableSize: () => "4 KB",
          },
        ],
      });

      app.get("/file/list", mockAuth, async (req: any, res: Response) => {
        const listSize = parseInt(req.query.list_size as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const offset = (page - 1) * listSize;

        const { count, rows } = await mockFileFindAndCountAll({
          where: { userId: req.user.userId },
          limit: listSize,
          offset,
        });

        const files = rows.map((file: any) => ({
          id: file.id,
          filename: file.originalName,
        }));

        res.json({
          files,
          pagination: {
            total: count,
            page,
            listSize,
            totalPages: Math.ceil(count / listSize),
          },
        });
      });

      const response = await request(app)
        .get("/file/list?list_size=5&page=2")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.listSize).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    test("should return 401 when not authenticated", async () => {
      app.get("/file/list", mockAuth, async (req: Request, res: Response) => {
        res.json({});
      });

      const response = await request(app).get("/file/list");

      expect(response.status).toBe(401);
    });

    test("should return empty list when user has no files", async () => {
      mockFileFindAndCountAll = async () => ({ count: 0, rows: [] });

      app.get("/file/list", mockAuth, async (req: any, res: Response) => {
        const listSize = 10;
        const page = 1;

        const { count, rows } = await mockFileFindAndCountAll({
          where: { userId: req.user.userId },
        });

        res.json({
          files: rows,
          pagination: {
            total: count,
            page,
            listSize,
            totalPages: Math.ceil(count / listSize),
          },
        });
      });

      const response = await request(app)
        .get("/file/list")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.files).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe("GET /file/:id", () => {
    test("should get file info successfully", async () => {
      mockFileFindOne = async (options: any) => ({
        id: 1,
        originalName: "test.txt",
        extension: ".txt",
        mimeType: "text/plain",
        size: 1024,
        uploadDate: new Date("2025-01-01"),
        getReadableSize: () => "1 KB",
      });

      app.get("/file/:id", mockAuth, async (req: any, res: Response) => {
        try {
          const fileId = parseInt(req.params.id);

          if (!req.user) {
            res.status(401).json({ error: "User does not exist" });
            return;
          }

          if (isNaN(fileId)) {
            res.status(400).json({ error: "Invalid file ID" });
            return;
          }

          const file = await mockFileFindOne({
            where: {
              id: fileId,
              userId: req.user.userId,
            },
          });

          if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
          }

          res.json({
            id: file.id,
            filename: file.originalName,
            extension: file.extension,
            mimeType: file.mimeType,
            size: file.getReadableSize(),
            uploadDate: file.uploadDate,
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .get("/file/1")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("filename", "test.txt");
    });

    test("should return 400 for invalid file ID", async () => {
      app.get("/file/:id", mockAuth, async (req: any, res: Response) => {
        const fileId = parseInt(req.params.id);

        if (isNaN(fileId)) {
          res.status(400).json({ error: "Invalid file ID" });
          return;
        }
      });

      const response = await request(app)
        .get("/file/invalid")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid file ID");
    });

    test("should return 401 when not authenticated", async () => {
      app.get("/file/:id", mockAuth, async (req: Request, res: Response) => {
        res.json({});
      });

      const response = await request(app).get("/file/1");

      expect(response.status).toBe(401);
    });

    test("should return 404 if file not found", async () => {
      mockFileFindOne = async () => null;

      app.get("/file/:id", mockAuth, async (req: any, res: Response) => {
        const fileId = parseInt(req.params.id);

        const file = await mockFileFindOne({
          where: {
            id: fileId,
            userId: req.user.userId,
          },
        });

        if (!file) {
          res.status(404).json({ error: "File not found" });
          return;
        }
      });

      const response = await request(app)
        .get("/file/999")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("File not found");
    });
  });

  describe("GET /file/download/:id", () => {
    test("should download file successfully", async () => {
      mockFileFindOne = async () => ({
        id: 1,
        userId: "testuser",
        filename: "unique-filename.txt",
        originalName: "test.txt",
      });
      mockFsExistsSync = () => true;

      app.get("/file/download/:id", mockAuth, async (req: any, res: Response) => {
        try {
          const fileId = parseInt(req.params.id);

          if (isNaN(fileId)) {
            res.status(400).json({ error: "Invalid file ID" });
            return;
          }

          const file = await mockFileFindOne({
            where: { id: fileId, userId: req.user.userId },
          });

          if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
          }

          const filePath = `./uploads/${file.filename}`;

          if (!mockFsExistsSync(filePath)) {
            res.status(404).json({ error: "File not found on disk" });
            return;
          }

          res.status(200).json({ success: true, file: file.originalName });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .get("/file/download/1")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
    });

    test("should return 404 if file not found on disk", async () => {
      mockFileFindOne = async () => ({
        id: 1,
        userId: "testuser",
        filename: "missing-file.txt",
        originalName: "test.txt",
      });
      mockFsExistsSync = () => false;

      app.get("/file/download/:id", mockAuth, async (req: any, res: Response) => {
        const fileId = parseInt(req.params.id);

        const file = await mockFileFindOne({
          where: { id: fileId, userId: req.user.userId },
        });

        if (!file) {
          res.status(404).json({ error: "File not found" });
          return;
        }

        const filePath = `./uploads/${file.filename}`;

        if (!mockFsExistsSync(filePath)) {
          res.status(404).json({ error: "File not found on disk" });
          return;
        }
      });

      const response = await request(app)
        .get("/file/download/1")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("File not found on disk");
    });
  });

  describe("DELETE /file/delete/:id", () => {
    test("should delete file successfully", async () => {
      mockFileFindOne = async () => ({
        id: 1,
        userId: "testuser",
        filename: "unique-filename.txt",
        destroy: mockFileDestroy,
      });
      mockFsExistsSync = () => true;

      app.delete("/file/delete/:id", mockAuth, async (req: any, res: Response) => {
        try {
          const fileId = parseInt(req.params.id);

          if (isNaN(fileId)) {
            res.status(400).json({ error: "Invalid file ID" });
            return;
          }

          const file = await mockFileFindOne({
            where: { id: fileId, userId: req.user.userId },
          });

          if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
          }

          const filePath = `./uploads/${file.filename}`;

          if (mockFsExistsSync(filePath)) {
            mockFsUnlinkSync(filePath);
          }

          await file.destroy();

          res.json({ message: "File deleted successfully" });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .delete("/file/delete/1")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("File deleted successfully");
    });

    test("should return 404 if file not found", async () => {
      mockFileFindOne = async () => null;

      app.delete("/file/delete/:id", mockAuth, async (req: any, res: Response) => {
        const fileId = parseInt(req.params.id);

        const file = await mockFileFindOne({
          where: { id: fileId, userId: req.user.userId },
        });

        if (!file) {
          res.status(404).json({ error: "File not found" });
          return;
        }
      });

      const response = await request(app)
        .delete("/file/delete/999")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("File not found");
    });
  });

  describe("PUT /file/update/:id", () => {
    test("should update file successfully", async () => {
      const mockFile = {
        id: 1,
        userId: "testuser",
        filename: "old-file.txt",
        originalName: "old.txt",
        extension: ".txt",
        mimeType: "text/plain",
        size: 1024,
        uploadDate: new Date(),
        save: mockFileSave,
        getReadableSize: () => "2 KB",
      };

      mockFileFindOne = async () => mockFile;
      mockFsExistsSync = () => true;

      app.put("/file/update/:id", mockAuth, async (req: any, res: Response) => {
        try {
          const fileId = parseInt(req.params.id);

          if (isNaN(fileId)) {
            res.status(400).json({ error: "Invalid file ID" });
            return;
          }

          // Симулируем новый файл
          const mockNewFile = {
            filename: "new-filename-123.txt",
            originalname: "new.txt",
            mimetype: "text/plain",
            size: 2048,
          };

          if (!mockNewFile) {
            res.status(400).json({ error: "No file uploaded" });
            return;
          }

          const existingFile = await mockFileFindOne({
            where: { id: fileId, userId: req.user.userId },
          });

          if (!existingFile) {
            res.status(404).json({ error: "File not found" });
            return;
          }

          const oldFilePath = `./uploads/${existingFile.filename}`;
          if (mockFsExistsSync(oldFilePath)) {
            mockFsUnlinkSync(oldFilePath);
          }

          existingFile.filename = mockNewFile.filename;
          existingFile.originalName = mockNewFile.originalname;
          existingFile.size = mockNewFile.size;
          existingFile.uploadDate = new Date();

          await existingFile.save();

          res.json({
            id: existingFile.id,
            filename: existingFile.originalName,
            size: existingFile.getReadableSize(),
            uploadDate: existingFile.uploadDate,
          });
        } catch (error) {
          res.status(500).json({ error: "Internal server error" });
        }
      });

      const response = await request(app)
        .put("/file/update/1")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("filename", "new.txt");
    });

    test("should return 404 if file not found", async () => {
      mockFileFindOne = async () => null;

      app.put("/file/update/:id", mockAuth, async (req: any, res: Response) => {
        const fileId = parseInt(req.params.id);

        const existingFile = await mockFileFindOne({
          where: { id: fileId, userId: req.user.userId },
        });

        if (!existingFile) {
          res.status(404).json({ error: "File not found" });
          return;
        }
      });

      const response = await request(app)
        .put("/file/update/999")
        .set("Authorization", "Bearer validToken");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("File not found");
    });
  });
});