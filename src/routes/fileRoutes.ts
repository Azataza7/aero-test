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

FileRouter.post('/upload', authenticate, upload.single('file'), uploadFile);
FileRouter.get('/list', authenticate, listFiles);
FileRouter.get('/:id', authenticate, getFile);
FileRouter.get('/download/:id', authenticate, downloadFile);
FileRouter.delete('/delete/:id', authenticate, deleteFile);
FileRouter.put('/update/:id', authenticate, upload.single('file'), updateFile);

export default FileRouter;