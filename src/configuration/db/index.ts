import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';

config({ path: '.env' }); // or .env.local

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle({ client, schema });
