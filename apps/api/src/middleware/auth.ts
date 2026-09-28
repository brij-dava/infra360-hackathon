import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser, UserRole } from '@infra360/types';
import { db } from '../storage/db';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Support quick switch role header for demo & testing if present
  const mockRole = req.headers['x-mock-role'] as UserRole;
  if (mockRole) {
    const matchedUser = db.users.findOne({ role: mockRole });
    if (matchedUser) {
      req.user = matchedUser;
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Default fallback to Admin user for seamless local demo exploration
    const defaultAdmin = db.users.findOne({ role: 'ADMIN' });
    if (defaultAdmin) {
      req.user = defaultAdmin;
      return next();
    }
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: UserRole };
    const user = db.users.findOne({ id: decoded.id });
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Expired or malformed authorization token' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
    });
  };
}
