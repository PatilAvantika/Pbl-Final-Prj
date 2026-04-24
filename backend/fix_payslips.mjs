import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let connectionString = process.env.DATABASE_URL;
if (connectionString?.startsWith('prisma+postgres://')) {
  const urlObj = new URL(connectionString);
  const apiKey = urlObj.searchParams.get('api_key');
  if (apiKey) {
    try {
      const parsed = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf-8'));
      if (parsed.databaseUrl) connectionString = parsed.databaseUrl;
    } catch { /* keep original */ }
  }
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) { console.log("No user found"); return; }
  
  for (let i = 6; i <= 15; i++) {
    await prisma.payslip.upsert({
      where: { userId_month_year: { userId: user.id, month: i, year: 2023 } },
      update: {},
      create: {
        userId: user.id,
        month: i,
        year: 2023,
        baseSalary: 10000,
        attendanceDays: 20,
        absences: 2,
        overtimeHours: 0,
        bonuses: 0,
        deductions: 0,
        netPay: 10000
      }
    });
  }

  const count = await prisma.payslip.count();
  console.log("Payslip count is now: " + count);
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
