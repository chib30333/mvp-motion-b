import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// 1. Initialize the Postgres connection pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// 2. Create the Driver Adapter for Prisma 7
const adapter = new PrismaPg(pool);

// 3. Setup global type for development hot-reloading
const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

// 4. Export the Prisma instance
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter, // This fixes the "requires adapter" error
        log: ['query', 'info', 'warn', 'error'],
    });

// 5. Save instance to global object in development
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}