import jwt from 'jsonwebtoken';
import  config  from '../config/index.js'

export const signToken = (payload: object) => jwt.sign(payload, config.auth.jwtExpiresIn,{expiresIn: '1h'});
export const verifyToken = (token: string) => jwt.verify(token, config.auth.jwtSecret);
