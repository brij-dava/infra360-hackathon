import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../storage/db';
import { config } from '../config';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// List all personas for demo role-switcher
router.get('/personas', (req: Request, res: Response) => {
  const users = db.users.find();
  res.json({ users });
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  let user = null;

  if (email) {
    user = db.users.findOne({ email });
  } else if (role) {
    user = db.users.findOne({ role });
  }

  if (!user) {
    user = db.users.findOne({ role: 'ADMIN' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User persona not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user,
  });
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
