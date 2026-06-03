import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name];
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const client = postgres(process.env.POSTGRES_URL, {
  max: readPositiveIntegerEnv('POSTGRES_MAX_CONNECTIONS', 5),
  idle_timeout: readPositiveIntegerEnv('POSTGRES_IDLE_TIMEOUT_SECONDS', 20),
  connect_timeout: readPositiveIntegerEnv('POSTGRES_CONNECT_TIMEOUT_SECONDS', 10),
});
export const db = drizzle(client, { schema });
