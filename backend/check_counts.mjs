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
  const counts = {
    Organization: await prisma.organization.count(),
    User: await prisma.user.count(),
    TeamRosterEntry: await prisma.teamRosterEntry.count(),
    RefreshToken: await prisma.refreshToken.count(),
    Task: await prisma.task.count(),
    Resource: await prisma.resource.count(),
    ResourceAllocation: await prisma.resourceAllocation.count(),
    DonorCampaign: await prisma.donorCampaign.count(),
    CampaignReport: await prisma.campaignReport.count(),
    Donation: await prisma.donation.count(),
    TaskAssignment: await prisma.taskAssignment.count(),
    Attendance: await prisma.attendance.count(),
    FieldReport: await prisma.fieldReport.count(),
    Leave: await prisma.leave.count(),
    Payslip: await prisma.payslip.count(),
    AuditLog: await prisma.auditLog.count()
  };
  console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
