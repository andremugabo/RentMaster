import { Request, Response } from 'express';
import * as service from '../services/auth.service.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip; 
    const { token, user } = await service.login({ email, password }, ipAddress);
    res.json({ token, user }); 
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;
    const performedBy = req.body.performedBy || 'system'; 
    const ipAddress = req.ip;
    const user = await service.createUser({ email, password, full_name, role }, performedBy, ipAddress);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
