import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

export const createUser = async (data: { email: string; password: string; full_name: string; role: string }) => {
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.users.create({ data: { ...data, password_hash: hashed } });
  // Log audit here
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new Error('Invalid credentials');
  return signToken({ id: user.id, role: user.role });
};
