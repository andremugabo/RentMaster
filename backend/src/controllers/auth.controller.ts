import { Request, Response } from 'express';
import * as service from '../services/auth.service.js';

export const login = async (req: Request, res: Response) => {
  try {

    const token = await service.login(req.body.email, req.body.password);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};


