import { Router } from 'express';
import { signup, signin, newToken, info, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const AuthRouter = Router();

AuthRouter.post('/signup', signup);
AuthRouter.post('/signin', signin);
AuthRouter.post('/signin/new_token', newToken);
AuthRouter.get('/info', authenticate, info);
AuthRouter.get('/logout', authenticate, logout);

export default AuthRouter;