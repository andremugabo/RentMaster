import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager';
}

interface LoginInput {
  email: string;
  password: string;
}

// Create a new user (admin-only)
export const createUser = async (data: CreateUserInput, performedBy: string, ipAddress?: string) => {
  // Check for existing user

  const existingUser = await prisma.users.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(data.password, 10);

  // Create user

  const user = await prisma.users.create({
    data: {
      email: data.email,
      password_hash,
      full_name: data.full_name,
      role: data.role,
      is_active: true,
      created_at: new Date(),
    },
  });

  // Log audit

  await prisma.auditLogs.create({
    data: {
      user_id: performedBy,
      action: 'CREATE',
      entity_table: 'Users',
      entity_id: user.id,
      new_data: {
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
      },
      ip_address: ipAddress,
      created_at: new Date(),
    },
  });

  logger.info(`User created: ${user.email} by ${performedBy}`);
  return { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
};

// User login
export const login = async ({ email, password }: LoginInput, ipAddress?: string) => {
  // Find user

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  // Log audit

  await prisma.auditLogs.create({
    data: {
      user_id: user.id,
      action: 'LOGIN',
      entity_table: 'Users',
      entity_id: user.id,
      ip_address: ipAddress,
      created_at: new Date(),
    },
  });

  logger.info(`User logged in: ${user.email}`);
  return { token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } };
};

// Optional: Refresh token (if implementing refresh tokens)
export const refreshToken = async (userId: string, ipAddress?: string) => {

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  // Log audit

  await prisma.auditLogs.create({
    data: {
      user_id: user.id,
      action: 'REFRESH_TOKEN',
      entity_table: 'Users',
      entity_id: user.id,
      ip_address: ipAddress,
      created_at: new Date(),
    },
  });

  logger.info(`Token refreshed for user: ${user.email}`);
  return { token };
};