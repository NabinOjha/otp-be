// setupJest.ts
import { execSync } from 'child_process';
import { PrismaClient } from './src/generated/prisma'
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load test-specific environment variables
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();
const databaseUrl = process.env.DATABASE_URL;

async function setupTestDatabase() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env.test');
  }

  // Extract database name from DATABASE_URL
  const dbName = databaseUrl.split('/').pop()?.split('?')[0];
  if (!dbName) {
    throw new Error('Could not extract database name from DATABASE_URL');
  }

  // Connect to PostgreSQL server using a default database for admin tasks
  // Using 'postgres' database (default in PostgreSQL) to create the test database
  const adminDb = 'postgres'; // Change to 'dev_db' if you prefer a specific dev database
  const client = new Client({
    connectionString: databaseUrl.replace(dbName, adminDb),
  });

  try {
    await client.connect();

    // Check if the test database exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      // Create the test database if it doesn't exist
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created test database: ${dbName}`);
    } else {
      console.log(`Test database ${dbName} already exists`);
    }
  } catch (error) {
    console.error(`Error creating test database '${dbName}':`, error);
    throw error;
  } finally {
    await client.end();
  }

  // Run prisma generate
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run prisma migrate for the test database
  console.log('Running prisma migrate dev for test database...');
  execSync('npx prisma migrate dev --name init', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  // Ensure Prisma client is connected
  await prisma.$connect();
}

async function teardownTestDatabase() {
  await prisma.$disconnect();
}

export default async () => {
  await setupTestDatabase();
  process.on('exit', async () => {
    await teardownTestDatabase();
  });
};