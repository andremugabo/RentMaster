import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const signToken = (payload: object) => 
  jwt.sign(payload, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn });

export const verifyToken = (token: string) => 
  jwt.verify(token, config.auth.jwtSecret);
