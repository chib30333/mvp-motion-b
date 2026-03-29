// src/app.ts or temp script

import { prisma } from './core/db/prisma.ts'

async function testDB() {
  await prisma.$connect()
  console.log('✅ DB connected')
}

testDB()