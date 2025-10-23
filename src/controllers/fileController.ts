import type { Response } from "express";
import path from "path";
import fs from "fs";
import { File } from "../models/File";
import type { AuthenticatedRequest } from "../middleware/auth";

export const uploadFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const file = await File.create({
      userId: req.user.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      extension: path.extname(req.file.originalname),
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
    });

    res.status(201).json({
      id: file.id,
      filename: file.originalName,
      size: file.getReadableSize(),
      uploadDate: file.uploadDate,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listFiles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const listSize = parseInt(req.query.list_size as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * listSize;

    const { count, rows } = await File.findAndCountAll({
      where: { userId: req.user.userId }, // Убрали !
      limit: listSize,
      offset,
      order: [["uploadDate", "DESC"]],
    });

    const files = rows.map((file) => ({
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
    console.error("List files error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fileId = parseInt(req.params.id!);

    if (isNaN(fileId)) {
      res.status(400).json({ error: "Invalid file ID" });
      return;
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.userId, // Убрали !
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
    console.error("Get file error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const downloadFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fileId = parseInt(req.params.id!);

    if (isNaN(fileId)) {
      res.status(400).json({ error: "Invalid file ID" });
      return;
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.userId, // Убрали !
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filePath = path.join("./uploads", file.filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found on disk" });
      return;
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fileId = parseInt(req.params.id!);

    if (isNaN(fileId)) {
      res.status(400).json({ error: "Invalid file ID" });
      return;
    }

    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.userId, // Убрали !
      },
    });

    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filePath = path.join("./uploads", file.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.destroy();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateFile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fileId = parseInt(req.params.id!);

    if (isNaN(fileId)) {
      res.status(400).json({ error: "Invalid file ID" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const existingFile = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.userId,
      },
    });

    if (!existingFile) {
      fs.unlinkSync(path.join("./uploads", req.file.filename));
      res.status(404).json({ error: "File not found" });
      return;
    }

    const oldFilePath = path.join("./uploads", existingFile.filename);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    existingFile.filename = req.file.filename;
    existingFile.originalName = req.file.originalname;
    existingFile.extension = path.extname(req.file.originalname);
    existingFile.mimeType = req.file.mimetype;
    existingFile.size = req.file.size;
    existingFile.uploadDate = new Date();

    await existingFile.save();

    res.json({
      id: existingFile.id,
      filename: existingFile.originalName,
      size: existingFile.getReadableSize(),
      uploadDate: existingFile.uploadDate,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
