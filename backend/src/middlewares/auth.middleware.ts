import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

interface User {
  id: string;
  role: 'ADMIN' | 'MANAGER';
  email?: string;
  full_name?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    req.user = verifyToken(token) as User; 
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
