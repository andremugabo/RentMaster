import { Request, Response } from 'express';
import * as service from '../services/auth.service.js';

export const login = async (req: Request, res: Response) => {
  try {
    const result = await service.login(req.body, req.ip);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = await service.createUser(req.body, req.user!.id, req.ip);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};