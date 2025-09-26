import dotenv from 'dotenv';
import path from 'path';

// Pick the right .env file based on NODE_ENV
const envFile = `.env${process.env['NODE_ENV'] ? `.${process.env['NODE_ENV']}` : ''}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * Helper that enforces required env variables at runtime.
 */
function requireEnv(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(` Missing required environment variable: ${key} (from ${envFile})`);
  }
  return value;
}

/**
 * Define a type-safe config schema
 */
interface AppConfig {
  env: 'development' | 'test' | 'production';
  port: number;
  db: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

const config: AppConfig = {
  env: (process.env['NODE_ENV'] as AppConfig['env']) || 'development',
  port: Number(process.env['PORT'] ?? 5000),
  db: {
    url: process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/rentmaster',
  },
  auth: {
    jwtSecret: process.env['JWT_SECRET'] ?? 'dev-secret',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '1h', 
  },
  logging: {
    level: (process.env['LOG_LEVEL'] as AppConfig['logging']['level']) ?? 'info',
  },
};

export default config;
