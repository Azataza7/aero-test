import { Router } from 'express';
import {
  uploadFile,
  listFiles,
  getFile,
  downloadFile,
  deleteFile,
  updateFile,
} from '../controllers/fileController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const FileRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: File ID
 *         filename:
 *           type: string
 *           description: Original filename
 *         size:
 *           type: string
 *           description: Human-readable file size
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: Upload date and time
 *       example:
 *         id: 1
 *         filename: document.pdf
 *         size: 2.5 MB
 *         uploadDate: 2025-10-24T10:30:00.000Z
 *
 *     FileInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: File ID
 *         filename:
 *           type: string
 *           description: Original filename
 *         extension:
 *           type: string
 *           description: File extension
 *         mimeType:
 *           type: string
 *           description: MIME type
 *         size:
 *           type: string
 *           description: Human-readable file size
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: Upload date and time
 *       example:
 *         id: 1
 *         filename: document.pdf
 *         extension: .pdf
 *         mimeType: application/pdf
 *         size: 2.5 MB
 *         uploadDate: 2025-10-24T10:30:00.000Z
 *
 *     FileList:
 *       type: object
 *       properties:
 *         files:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileInfo'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of files
 *             page:
 *               type: integer
 *               description: Current page number
 *             listSize:
 *               type: integer
 *               description: Number of items per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *       example:
 *         files:
 *           - id: 1
 *             filename: document.pdf
 *             extension: .pdf
 *             mimeType: application/pdf
 *             size: 2.5 MB
 *             uploadDate: 2025-10-24T10:30:00.000Z
 *         pagination:
 *           total: 25
 *           page: 1
 *           listSize: 10
 *           totalPages: 3
 *
 *     DeleteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *       example:
 *         message: File deleted successfully
 *
 * tags:
 *   name: Files
 *   description: File management endpoints
 */

/**
 * @swagger
 * /api/file/upload:
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 10MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.post('/upload', authenticate, upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/file/list:
 *   get:
 *     summary: List all files for the authenticated user
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: list_size
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of files per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.get('/list', authenticate, listFiles);

/**
 * @swagger
 * /api/file/{id}:
 *   get:
 *     summary: Get file information by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileInfo'
 *       400:
 *         description: Invalid file ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid file ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: File not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.get('/:id', authenticate, getFile);

/**
 * @swagger
 * /api/file/download/{id}:
 *   get:
 *     summary: Download a file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid file ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid file ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notInDatabase:
 *                 value:
 *                   error: File not found
 *               notOnDisk:
 *                 value:
 *                   error: File not found on disk
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.get('/download/:id', authenticate, downloadFile);

/**
 * @swagger
 * /api/file/delete/{id}:
 *   delete:
 *     summary: Delete a file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *       400:
 *         description: Invalid file ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid file ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: File not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.delete('/delete/:id', authenticate, deleteFile);

/**
 * @swagger
 * /api/file/update/{id}:
 *   put:
 *     summary: Update/replace a file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New file to replace the existing one (max 10MB)
 *     responses:
 *       200:
 *         description: File updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: Invalid file ID or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidId:
 *                 value:
 *                   error: Invalid file ID
 *               noFile:
 *                 value:
 *                   error: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User does not exist
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: File not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
FileRouter.put('/update/:id', authenticate, upload.single('file'), updateFile);

export default FileRouter;