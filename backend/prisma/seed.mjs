import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const MAX_SEED_RETRIES = 3;

function isTransientDbError(error) {
  const message = String(error?.message ?? error ?? '').toLowerCase();
  return (
    message.includes('p1001') ||
    message.includes('not queryable') ||
    message.includes('connection error') ||
    message.includes('econnreset') ||
    message.includes('terminating connection')
  );
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function prismaFromEnv() {
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
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

/** Returns a Date for a given day offset from today at a specific hour:minute */
function d(dayOffset, hour = 0, min = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, min, 0, 0);
  return date;
}

async function main() {
  const { prisma, pool } = prismaFromEnv();

  try {

    const DEFAULT_ORG_ID = '00000000-0000-4000-8000-000000000001';

    // ─── Organization (multi-tenant) ───────────────────────────────────────────
    await prisma.organization.upsert({
      where: { slug: 'default' },
      update: {},
      create: { id: DEFAULT_ORG_ID, name: 'Default Organization', slug: 'default' },
    });

    // ─── Passwords ───────────────────────────────────────────────────────────────
    const adminPwd = await bcrypt.hash('Admin@1234', 10);
    const volPwd = await bcrypt.hash('Volunteer@1234', 10);

    // ─── Users ───────────────────────────────────────────────────────────────────
    console.log('👤 Upserting users…');

    const admin = await prisma.user.upsert({
      where: { email: 'ananya.kapoor@sevasetu.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'ananya.kapoor@sevasetu.demo', passwordHash: adminPwd, role: 'NGO_ADMIN', organizationId: DEFAULT_ORG_ID, firstName: 'Ananya', lastName: 'Kapoor', deviceId: 'device-admin-001', isActive: true },
    });

    const coord = await prisma.user.upsert({
      where: { email: 'rohan.das@sevasetu.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'rohan.das@sevasetu.demo', passwordHash: adminPwd, role: 'FIELD_COORDINATOR', organizationId: DEFAULT_ORG_ID, firstName: 'Rohan', lastName: 'Das', deviceId: 'device-coord-001', isActive: true },
    });

    const priya = await prisma.user.upsert({
      where: { email: 'priya.sharma@sevasetu.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'priya.sharma@sevasetu.demo', passwordHash: volPwd, role: 'VOLUNTEER', organizationId: DEFAULT_ORG_ID, firstName: 'Priya', lastName: 'Sharma', deviceId: 'device-vol-priya', isActive: true },
    });

    const arjun = await prisma.user.upsert({
      where: { email: 'arjun.mehta@sevasetu.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'arjun.mehta@sevasetu.demo', passwordHash: volPwd, role: 'VOLUNTEER', organizationId: DEFAULT_ORG_ID, firstName: 'Arjun', lastName: 'Mehta', deviceId: 'device-vol-arjun', isActive: true },
    });

    const harry = await prisma.user.upsert({
      where: { email: 'harry.hr@sevasetu.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'harry.hr@sevasetu.demo', passwordHash: adminPwd, role: 'HR_MANAGER', organizationId: DEFAULT_ORG_ID, firstName: 'Harry', lastName: 'HR', deviceId: 'device-hr-001', isActive: true },
    });

    // Keep legacy demo accounts for backward compatibility
    const legacyAdminHash = await bcrypt.hash('Demo1234!', 10);
    await prisma.user.upsert({
      where: { email: 'demo.user1@ngo.local' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'demo.user1@ngo.local', passwordHash: legacyAdminHash, role: 'NGO_ADMIN', organizationId: DEFAULT_ORG_ID, firstName: 'Demo', lastName: 'Admin', deviceId: 'demo-device-admin' },
    });
    await prisma.user.upsert({
      where: { email: 'demo.user2@ngo.local' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'demo.user2@ngo.local', passwordHash: legacyAdminHash, role: 'FIELD_COORDINATOR', organizationId: DEFAULT_ORG_ID, firstName: 'Demo', lastName: 'Field', deviceId: 'demo-device-field' },
    });
    await prisma.user.upsert({
      where: { email: 'volunteer@fieldops.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: { email: 'volunteer@fieldops.demo', passwordHash: await bcrypt.hash('password123', 10), role: 'VOLUNTEER', organizationId: DEFAULT_ORG_ID, firstName: 'Demo', lastName: 'Volunteer', deviceId: 'demo-device-volunteer' },
    });

    // ─── Tasks ───────────────────────────────────────────────────────────────────
    console.log('📋 Upserting tasks…');

    // Tasks don't have a natural unique key other than id, so we find-or-create by title
    let task1 = await prisma.task.findFirst({ where: { title: 'Tree Plantation Drive — Aarey Colony' } });
    if (!task1) {
      task1 = await prisma.task.create({
        data: {
          title: 'Tree Plantation Drive — Aarey Colony',
          description: 'Plant native saplings across the designated plots in Aarey Colony. Each volunteer is responsible for 10 saplings. Bring water, gloves, and label sticks.',
          template: 'PLANTATION',
          zoneName: 'Aarey Colony Zone 3',
          geofenceLat: 19.1687,
          geofenceLng: 72.8794,
          geofenceRadius: 200,
          startTime: d(0, 7, 0),
          endTime: d(0, 13, 0),
          isActive: true,
          organizationId: DEFAULT_ORG_ID,
        }
      });
    } else if (!task1.organizationId) {
      await prisma.task.update({ where: { id: task1.id }, data: { organizationId: DEFAULT_ORG_ID } });
      task1 = await prisma.task.findUniqueOrThrow({ where: { id: task1.id } });
    }

    let task2 = await prisma.task.findFirst({ where: { title: 'Beach Cleanup Drive — Juhu Beach' } });
    if (!task2) {
      task2 = await prisma.task.create({
        data: {
          title: 'Beach Cleanup Drive — Juhu Beach',
          description: 'Collect plastic waste, glass, and debris from the 1.2km stretch near Juhu beach entry. Sort waste into recyclable and non-recyclable bags provided at the site.',
          template: 'WASTE_COLLECTION',
          zoneName: 'Juhu Beach — North End',
          geofenceLat: 19.0968,
          geofenceLng: 72.8267,
          geofenceRadius: 300,
          startTime: d(1, 6, 30),
          endTime: d(1, 10, 30),
          isActive: true,
          organizationId: DEFAULT_ORG_ID,
        }
      });
    } else if (!task2.organizationId) {
      await prisma.task.update({ where: { id: task2.id }, data: { organizationId: DEFAULT_ORG_ID } });
      task2 = await prisma.task.findUniqueOrThrow({ where: { id: task2.id } });
    }

    // ─── Task Assignments ─────────────────────────────────────────────────────────
    console.log('🔗 Upserting task assignments…');

    for (const [userId, taskId] of [
      [priya.id, task1.id], [priya.id, task2.id],
      [arjun.id, task1.id], [arjun.id, task2.id],
      [admin.id, task1.id], [coord.id, task2.id],
    ]) {
      await prisma.taskAssignment.upsert({
        where: { userId_taskId: { userId, taskId } },
        update: {},
        create: { userId, taskId },
      });
    }

    // ─── Attendance ───────────────────────────────────────────────────────────────
    console.log('📍 Upserting attendance records…');

    // Helper: upsert by uniqueRequestId
    const upsertAtt = (reqId, data) =>
      prisma.attendance.upsert({
        where: { uniqueRequestId: reqId },
        update: {},
        create: { ...data, uniqueRequestId: reqId, syncStatus: 'SYNCED' },
      });

    // Priya — 8 days of attendance this month for a strong calendar visual
    const priyaAttendance = [
      // -6 days
      { reqId: 'priya-t1-d6-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(-6, 8, 5), type: 'CLOCK_IN', lat: 19.1688, lng: 72.8795, accuracyMeters: 10, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'priya-t1-d6-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-6, 12, 45), type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8795, accuracyMeters: 10, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      // -5 days
      { reqId: 'priya-t1-d5-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(-5, 7, 55), type: 'CLOCK_IN', lat: 19.1689, lng: 72.8793, accuracyMeters: 8, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'priya-t1-d5-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-5, 13, 10), type: 'CLOCK_OUT', lat: 19.1689, lng: 72.8793, accuracyMeters: 8, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      // -3 days
      { reqId: 'priya-t1-d3-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(-3, 8, 0), type: 'CLOCK_IN', lat: 19.1687, lng: 72.8794, accuracyMeters: 12, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'priya-t1-d3-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-3, 12, 55), type: 'CLOCK_OUT', lat: 19.1687, lng: 72.8794, accuracyMeters: 12, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      // -2 days
      { reqId: 'priya-t1-d2-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(-2, 8, 10), type: 'CLOCK_IN', lat: 19.1686, lng: 72.8796, accuracyMeters: 9, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'priya-t1-d2-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-2, 13, 5), type: 'CLOCK_OUT', lat: 19.1686, lng: 72.8796, accuracyMeters: 9, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      // Yesterday
      { reqId: 'priya-t1-d1-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(-1, 7, 58), type: 'CLOCK_IN', lat: 19.1688, lng: 72.8795, accuracyMeters: 11, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'priya-t1-d1-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-1, 13, 0), type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8795, accuracyMeters: 11, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
      // Today
      { reqId: 'priya-t1-d0-in', data: { userId: priya.id, taskId: task1.id, timestamp: d(0, 8, 2), type: 'CLOCK_IN', lat: 19.1687, lng: 72.8794, accuracyMeters: 14, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' } },
    ];

    // Arjun — 6 days of attendance
    const arjunAttendance = [
      // -5 days
      { reqId: 'arjun-t1-d5-in', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-5, 8, 20), type: 'CLOCK_IN', lat: 19.1690, lng: 72.8792, accuracyMeters: 15, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'arjun-t1-d5-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-5, 12, 30), type: 'CLOCK_OUT', lat: 19.1690, lng: 72.8792, accuracyMeters: 15, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      // -4 days
      { reqId: 'arjun-t1-d4-in', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-4, 7, 45), type: 'CLOCK_IN', lat: 19.1691, lng: 72.8793, accuracyMeters: 10, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'arjun-t1-d4-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-4, 12, 40), type: 'CLOCK_OUT', lat: 19.1691, lng: 72.8793, accuracyMeters: 10, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      // -2 days
      { reqId: 'arjun-t1-d2-in', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-2, 8, 5), type: 'CLOCK_IN', lat: 19.1688, lng: 72.8794, accuracyMeters: 13, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'arjun-t1-d2-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-2, 13, 15), type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8794, accuracyMeters: 13, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      // Yesterday
      { reqId: 'arjun-t1-d1-in', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-1, 8, 0), type: 'CLOCK_IN', lat: 19.1687, lng: 72.8795, accuracyMeters: 9, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
      { reqId: 'arjun-t1-d1-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-1, 12, 50), type: 'CLOCK_OUT', lat: 19.1687, lng: 72.8795, accuracyMeters: 9, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' } },
    ];

    for (const { reqId, data } of [...priyaAttendance, ...arjunAttendance]) {
      await upsertAtt(reqId, data);
    }

    // ─── Field Reports ────────────────────────────────────────────────────────────
    console.log('📝 Upserting field reports…');

    const priyaReportCount = await prisma.fieldReport.count({ where: { userId: priya.id } });
    if (priyaReportCount === 0) {
      await prisma.fieldReport.createMany({
        data: [
          {
            taskId: task1.id,
            userId: priya.id,
            organizationId: DEFAULT_ORG_ID,
            quantityItems: 22,
            notes: 'Planted 22 native saplings including Neem, Peepal, and Karanj varieties across Plot 3C. Soil was dry — added water from the tank. All saplings labelled and logged.',
            status: 'APPROVED',
            approvedById: admin.id,
            approvedAt: d(-3, 15, 0),
            timestamp: d(-3, 13, 10),
          },
          {
            taskId: task1.id,
            userId: priya.id,
            organizationId: DEFAULT_ORG_ID,
            quantityItems: 18,
            notes: 'Completed second plantation round at Plot 3D. Some saplings from yesterday\'s batch needed re-staking due to wind. Flagged 3 damaged saplings for replacement.',
            status: 'SUBMITTED',
            timestamp: d(-1, 13, 5),
          },
        ]
      });
    }

    const arjunReportCount = await prisma.fieldReport.count({ where: { userId: arjun.id } });
    if (arjunReportCount === 0) {
      await prisma.fieldReport.createMany({
        data: [
          {
            taskId: task1.id,
            userId: arjun.id,
            organizationId: DEFAULT_ORG_ID,
            quantityItems: 19,
            notes: 'Cleared 19 large waste bags from the north end of the site. Found significant polythene accumulation near the drain — reported to zone supervisor. Waste segregation done at collection point.',
            status: 'APPROVED',
            approvedById: admin.id,
            approvedAt: d(-4, 16, 30),
            timestamp: d(-4, 12, 45),
          },
          {
            taskId: task1.id,
            userId: arjun.id,
            organizationId: DEFAULT_ORG_ID,
            quantityItems: 25,
            notes: 'Good turnout at today\'s cleanup. Collected 25 bags total — 16 recyclable, 9 non-recyclable. Team spirits high. Suggest increasing frequency at this zone.',
            status: 'SUBMITTED',
            timestamp: d(-1, 12, 55),
          },
        ]
      });
    }

    const task2ApprovedCount = await prisma.fieldReport.count({
      where: { taskId: task2.id, status: 'APPROVED' },
    });
    if (task2ApprovedCount === 0) {
      await prisma.fieldReport.create({
        data: {
          taskId: task2.id,
          userId: priya.id,
          organizationId: DEFAULT_ORG_ID,
          quantityItems: 42,
          notes: 'Juhu north stretch cleanup — 42 bags sorted; high tide line cleared of micro-plastics.',
          status: 'APPROVED',
          approvedById: admin.id,
          approvedAt: d(-10, 17, 0),
          timestamp: d(-10, 14, 30),
        },
      });
    }

    // ─── Donor portal (campaigns, donations) ────────────────────────────────────
    console.log('💝 Donor campaigns & donations…');
    const donorPwd = await bcrypt.hash('Donor@1234', 10);
    const donorUser = await prisma.user.upsert({
      where: { email: 'donor@fieldops.demo' },
      update: { organizationId: DEFAULT_ORG_ID },
      create: {
        email: 'donor@fieldops.demo',
        passwordHash: donorPwd,
        role: 'DONOR',
        organizationId: DEFAULT_ORG_ID,
        firstName: 'Maya',
        lastName: 'Patil',
        deviceId: 'device-donor-001',
        isActive: true,
      },
    });

    let dc1 = await prisma.donorCampaign.findFirst({ where: { taskId: task1.id } });
    if (!dc1) {
      dc1 = await prisma.donorCampaign.create({
        data: {
          title: 'Aarey Green Belt — Donor-funded',
          description: 'Native sapling programme aligned with the Aarey field task; donors receive verified plantation reports.',
          zoneName: task1.zoneName,
          lat: task1.geofenceLat,
          lng: task1.geofenceLng,
          startDate: task1.startTime,
          endDate: task1.endTime,
          status: 'ACTIVE',
          taskId: task1.id,
          organizationId: DEFAULT_ORG_ID,
        },
      });
    } else {
      await prisma.donorCampaign.update({
        where: { id: dc1.id },
        data: {
          description: 'Native sapling programme aligned with the Aarey field task; donors receive verified plantation reports.',
          startDate: task1.startTime,
          endDate: task1.endTime,
          organizationId: DEFAULT_ORG_ID,
        },
      });
    }
    let dc2 = await prisma.donorCampaign.findFirst({ where: { taskId: task2.id } });
    if (!dc2) {
      dc2 = await prisma.donorCampaign.create({
        data: {
          title: 'Juhu Shoreline Restoration',
          description: 'Coastal cleanup and plastic diversion; impact tracked through approved field reports.',
          zoneName: task2.zoneName,
          lat: task2.geofenceLat,
          lng: task2.geofenceLng,
          startDate: task2.startTime,
          endDate: task2.endTime,
          status: 'COMPLETED',
          taskId: task2.id,
          organizationId: DEFAULT_ORG_ID,
        },
      });
    } else {
      await prisma.donorCampaign.update({
        where: { id: dc2.id },
        data: {
          description: 'Coastal cleanup and plastic diversion; impact tracked through approved field reports.',
          startDate: task2.startTime,
          endDate: task2.endTime,
          organizationId: DEFAULT_ORG_ID,
        },
      });
    }

    const donationCount = await prisma.donation.count({ where: { donorId: donorUser.id } });
    if (donationCount === 0) {
      await prisma.donation.createMany({
        data: [
          { donorId: donorUser.id, campaignId: dc1.id, amount: 25000, currency: 'INR' },
          { donorId: donorUser.id, campaignId: dc1.id, amount: 15000, currency: 'INR', createdAt: d(-45) },
          { donorId: donorUser.id, campaignId: dc2.id, amount: 40000, currency: 'INR' },
        ],
      });
    }

    await prisma.fieldReport.updateMany({
      where: { taskId: { in: [task1.id, task2.id] }, status: 'APPROVED', beforePhotoUrl: null },
      data: {
        beforePhotoUrl: 'https://images.unsplash.com/photo-1618477388954-7852f326dddb?w=800&q=80',
        afterPhotoUrl: 'https://images.unsplash.com/photo-1497436072909-60f360a1ab4e?w=800&q=80',
      },
    });

    // Donor portal: only CampaignReport-linked APPROVED reports are visible — seed explicit links.
    console.log('🔗 Linking approved reports to donor campaigns (CampaignReport)…');
    dc1 = await prisma.donorCampaign.findFirstOrThrow({ where: { id: dc1.id } });
    dc2 = await prisma.donorCampaign.findFirstOrThrow({ where: { id: dc2.id } });
    for (const { id } of await prisma.fieldReport.findMany({
      where: { taskId: task1.id, status: 'APPROVED' },
      select: { id: true },
    })) {
      await prisma.campaignReport.upsert({
        where: { campaignId_reportId: { campaignId: dc1.id, reportId: id } },
        create: { campaignId: dc1.id, reportId: id },
        update: {},
      });
    }
    for (const { id } of await prisma.fieldReport.findMany({
      where: { taskId: task2.id, status: 'APPROVED' },
      select: { id: true },
    })) {
      await prisma.campaignReport.upsert({
        where: { campaignId_reportId: { campaignId: dc2.id, reportId: id } },
        create: { campaignId: dc2.id, reportId: id },
        update: {},
      });
    }

    // ─── Leaves ───────────────────────────────────────────────────────────────────
    console.log('🗓  Upserting leave records…');

    const priyaLeaveCount = await prisma.leave.count({ where: { userId: priya.id } });
    if (priyaLeaveCount === 0) {
      await prisma.leave.createMany({
        data: [
          {
            userId: priya.id,
            type: 'CASUAL',
            startDate: d(5),
            endDate: d(6),
            status: 'PENDING',
            reason: 'Family function — sister\'s engagement ceremony in Pune. Will be travelling back by Sunday evening.',
          },
          {
            userId: priya.id,
            type: 'SICK',
            startDate: d(-10),
            endDate: d(-9),
            status: 'APPROVED',
            reason: 'Fever and throat infection — resting on doctor\'s advice. Medical certificate will be submitted on return.',
          },
        ]
      });
    }

    const arjunLeaveCount = await prisma.leave.count({ where: { userId: arjun.id } });
    if (arjunLeaveCount === 0) {
      await prisma.leave.createMany({
        data: [
          {
            userId: arjun.id,
            type: 'CASUAL',
            startDate: d(10),
            endDate: d(11),
            status: 'APPROVED',
            reason: 'Personal work — need to appear for a local government document process. Only available on these two days.',
          },
          {
            userId: arjun.id,
            type: 'UNPAID',
            startDate: d(20),
            endDate: d(22),
            status: 'PENDING',
            reason: 'Village visit for grandmother\'s 80th birthday celebration. Extended family gathering — need 3 days.',
          },
        ]
      });
    }

    // ─── AuditLogs ────────────────────────────────────────────────────────────────
    console.log('📊 Upserting audit logs…');

    const auditCount = await prisma.auditLog.count();
    if (auditCount === 0) {
      await prisma.auditLog.createMany({
        data: [
          { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: priya.id, metadata: { note: 'Volunteer Priya Sharma onboarded' }, createdAt: d(-30) },
          { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: arjun.id, metadata: { note: 'Volunteer Arjun Mehta onboarded' }, createdAt: d(-29) },
          { actorId: coord.id, action: 'TASK_CREATED', entityType: 'Task', entityId: task1.id, metadata: { note: 'Tree plantation task created' }, createdAt: d(-7) },
          { actorId: coord.id, action: 'TASK_CREATED', entityType: 'Task', entityId: task2.id, metadata: { note: 'Beach cleanup task created' }, createdAt: d(-6) },
          { actorId: coord.id, action: 'TASK_ASSIGNED', entityType: 'Task', entityId: task1.id, metadata: { assignedTo: priya.id }, createdAt: d(-7) },
          { actorId: coord.id, action: 'TASK_ASSIGNED', entityType: 'Task', entityId: task1.id, metadata: { assignedTo: arjun.id }, createdAt: d(-7) },
          { actorId: admin.id, action: 'REPORT_STATUS_UPDATED', entityType: 'FieldReport', entityId: 'seed-report-1', metadata: { status: 'APPROVED', vol: priya.email }, createdAt: d(-3) },
          { actorId: admin.id, action: 'LEAVE_STATUS_UPDATED', entityType: 'Leave', entityId: 'seed-leave-1', metadata: { status: 'APPROVED', vol: priya.email }, createdAt: d(-9) },
        ]
      });
    }

    // ─── Persona Portal Population (Populate dashboards for 5 people) ───────────
    console.log('🚀 Populating specific persona portals with rich data...');

    // 1. Volunteer Portal (Priya)
    // Ensure she has a mix of task statuses
    await prisma.task.create({
      data: {
        title: 'Education Survey — Dharavi',
        template: 'SURVEY',
        zoneName: 'Dharavi Sector 5',
        geofenceLat: 19.0448,
        geofenceLng: 72.8548,
        geofenceRadius: 500,
        startTime: d(-1, 9, 0),
        endTime: d(-1, 17, 0),
        lifecycleStatus: 'COMPLETED',
        organizationId: DEFAULT_ORG_ID,
        assignments: { create: { userId: priya.id } },
        attendances: {
          createMany: {
            data: [
              { userId: priya.id, type: 'CLOCK_IN', timestamp: d(-1, 9, 5), lat: 19.0448, lng: 72.8548, accuracyMeters: 10, deviceId: 'device-vol-priya', uniqueRequestId: 'priya-survey-in' },
              { userId: priya.id, type: 'CLOCK_OUT', timestamp: d(-1, 16, 55), lat: 19.0448, lng: 72.8548, accuracyMeters: 10, deviceId: 'device-vol-priya', uniqueRequestId: 'priya-survey-out' },
            ]
          }
        }
      }
    });

    // 2. Field Coordinator Portal (Rohan)
    // Give him a team and tasks to lead
    await prisma.teamRosterEntry.upsert({
      where: { leaderId_volunteerId: { leaderId: coord.id, volunteerId: priya.id } },
      update: {},
      create: { leaderId: coord.id, volunteerId: priya.id }
    });
    await prisma.teamRosterEntry.upsert({
      where: { leaderId_volunteerId: { leaderId: coord.id, volunteerId: arjun.id } },
      update: {},
      create: { leaderId: coord.id, volunteerId: arjun.id }
    });
    
    await prisma.task.update({
      where: { id: task1.id },
      data: { teamLeaderId: coord.id }
    });

    // 3. Donor Portal (Maya)
    // Ensure she has donations linked to campaigns with reports
    await prisma.donation.create({
      data: { donorId: donorUser.id, campaignId: dc1.id, amount: 50000, currency: 'INR', createdAt: d(-5) }
    });

    // 4. HR Portal (Harry)
    // Give him leaves to manage
    await prisma.leave.createMany({
      data: [
        { userId: priya.id, type: 'SICK', startDate: d(2), endDate: d(3), status: 'PENDING', reason: 'Flu symptoms' },
        { userId: arjun.id, type: 'CASUAL', startDate: d(15), endDate: d(17), status: 'PENDING', reason: 'Sibling wedding' },
      ]
    });

    // 5. Admin Portal (Ananya)
    // Ensure she has high-level metrics (reports from everywhere)
    for (let i = 0; i < 5; i++) {
       await prisma.fieldReport.create({
         data: {
           taskId: task1.id,
           userId: arjun.id,
           organizationId: DEFAULT_ORG_ID,
           notes: `Admin overview report ${i}`,
           status: 'SUBMITTED',
           timestamp: d(-i)
         }
       });
    }

    // ─── 10x MOCK DATA GENERATOR ──────────────────────────────────────────────
    console.log('🚀 Generating additional mock data to ensure >=10 items per table...');
    
    // 1. Orgs
    for (let i = 1; i <= 9; i++) {
      await prisma.organization.upsert({
        where: { slug: `org-${i}` },
        update: {},
        create: { id: `org-${i}-uuid`, name: `Additional Org ${i}`, slug: `org-${i}` }
      });
    }

    // 2. Users
    for (let i = 1; i <= 5; i++) {
      await prisma.user.upsert({
        where: { email: `mock.user${i}@demo.local` },
        update: {},
        create: {
          email: `mock.user${i}@demo.local`,
          passwordHash: volPwd,
          role: 'VOLUNTEER',
          organizationId: DEFAULT_ORG_ID,
          firstName: 'Mock',
          lastName: `Volunteer ${i}`,
          deviceId: `mock-device-${i}`,
          isActive: true
        }
      });
    }

    // 3. TeamRosterEntry
    const allVols = await prisma.user.findMany({ where: { role: 'VOLUNTEER' } });
    for (let i = 0; i < Math.min(10, allVols.length); i++) {
      await prisma.teamRosterEntry.upsert({
        where: { leaderId_volunteerId: { leaderId: coord.id, volunteerId: allVols[i].id } },
        update: {},
        create: { leaderId: coord.id, volunteerId: allVols[i].id }
      });
    }

    // 4. RefreshToken
    for (let i = 0; i < 10; i++) {
      await prisma.refreshToken.upsert({
        where: { tokenHash: `mock-hash-${i}` },
        update: {},
        create: { userId: admin.id, tokenHash: `mock-hash-${i}`, expiresAt: d(10) }
      });
    }

    // 5. Tasks
    for (let i = 1; i <= 8; i++) {
      let existing = await prisma.task.findFirst({ where: { title: `Mock Task ${i}` } });
      if (!existing) {
        await prisma.task.create({
          data: {
            title: `Mock Task ${i}`,
            description: 'Mock task description.',
            template: 'AWARENESS',
            zoneName: `Zone ${i}`,
            geofenceLat: 19.0,
            geofenceLng: 72.8,
            geofenceRadius: 100,
            startTime: d(i, 8, 0),
            endTime: d(i, 12, 0),
            isActive: true,
            organizationId: DEFAULT_ORG_ID
          }
        });
      }
    }

    // 6. Resources & Resource Allocations
    const allTasks = await prisma.task.findMany({ take: 10 });
    for (let i = 1; i <= 10; i++) {
      let res = await prisma.resource.findFirst({ where: { name: `Mock Resource ${i}` } });
      if (!res) {
        res = await prisma.resource.create({
          data: { name: `Mock Resource ${i}`, quantity: 100, organizationId: DEFAULT_ORG_ID }
        });
      }
      if (allTasks[i % allTasks.length]) {
        await prisma.resourceAllocation.create({
          data: { resourceId: res.id, taskId: allTasks[i % allTasks.length].id, quantity: 5 }
        });
      }
    }

    // 7. DonorCampaigns & Donations
    for (let i = 1; i <= 10; i++) {
      let camp = await prisma.donorCampaign.findFirst({ where: { title: `Mock Campaign ${i}` } });
      if (!camp) {
        camp = await prisma.donorCampaign.create({
          data: {
            title: `Mock Campaign ${i}`,
            zoneName: `Mock Zone ${i}`,
            lat: 19.0,
            lng: 72.8,
            organizationId: DEFAULT_ORG_ID
          }
        });
      }
      await prisma.donation.create({
        data: { donorId: donorUser.id, campaignId: camp.id, amount: 1000 * i, currency: 'INR' }
      });
    }

    // 8. FieldReports
    const rps = await prisma.fieldReport.count();
    for (let i = rps; i < 15; i++) {
      await prisma.fieldReport.create({
        data: {
          taskId: task1.id,
          userId: priya.id,
          organizationId: DEFAULT_ORG_ID,
          quantityItems: i,
          notes: `Mock report ${i}`,
          status: 'APPROVED'
        }
      });
    }

    // 9. CampaignReports
    const crps = await prisma.campaignReport.count();
    const approvedReports = await prisma.fieldReport.findMany({ where: { status: 'APPROVED' }, take: Math.max(0, 15 - crps) });
    const campsForReports = await prisma.donorCampaign.findMany({ take: approvedReports.length });
    for (let i = 0; i < Math.min(approvedReports.length, campsForReports.length); i++) {
      await prisma.campaignReport.upsert({
        where: { campaignId_reportId: { campaignId: campsForReports[i].id, reportId: approvedReports[i].id } },
        update: {},
        create: { campaignId: campsForReports[i].id, reportId: approvedReports[i].id }
      });
    }

    // 10. Task Assignments
    for (let i = 0; i < Math.min(5, allTasks.length); i++) {
      await prisma.taskAssignment.upsert({
        where: { userId_taskId: { userId: priya.id, taskId: allTasks[i].id } },
        update: {},
        create: { userId: priya.id, taskId: allTasks[i].id }
      });
    }

    // 11. Leave
    for (let i = 1; i <= 6; i++) {
      await prisma.leave.create({
        data: {
          userId: priya.id,
          type: 'CASUAL',
          startDate: d(100 + i),
          endDate: d(100 + i + 1),
          status: 'PENDING',
          reason: `Mock leave ${i}`
        }
      });
    }

    // 12. Payslip
    for (let i = 1; i <= 10; i++) {
      await prisma.payslip.upsert({
        where: { userId_month_year: { userId: priya.id, month: i, year: 2024 } },
        update: {},
        create: {
          userId: priya.id,
          month: i,
          year: 2024,
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

    // 13. AuditLog
    for (let i = 1; i <= 5; i++) {
      await prisma.auditLog.create({
        data: { actorId: admin.id, action: 'USER_CREATED', entityType: 'User', entityId: priya.id, metadata: { mock: true } }
      });
    }

    // ─── Done ─────────────────────────────────────────────────────────────────────
    console.log('\n✅ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 Admin accounts:');
    console.log('   ananya.kapoor@sevasetu.demo  /  Admin@1234  (NGO_ADMIN)');
    console.log('   rohan.das@sevasetu.demo      /  Admin@1234  (FIELD_COORDINATOR)');
    console.log('\n🌿 Volunteer accounts:');
    console.log('   priya.sharma@sevasetu.demo   /  Volunteer@1234  (VOLUNTEER)');
    console.log('   arjun.mehta@sevasetu.demo    /  Volunteer@1234  (VOLUNTEER)');
    console.log('\n📦 Legacy demo accounts still work:');
    console.log('   demo.user1@ngo.local         /  Demo1234!');
    console.log('   volunteer@fieldops.demo      /  password123');
    console.log('\n💚 Donor portal:');
    console.log('   donor@fieldops.demo          /  Donor@1234');
    console.log('\n💼 HR portal:');
    console.log('   harry.hr@sevasetu.demo       /  Admin@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } finally {
    await prisma.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }
}

async function runSeedWithRetry() {
  for (let attempt = 1; attempt <= MAX_SEED_RETRIES; attempt += 1) {
    try {
      await main();
      return;
    } catch (error) {
      if (!isTransientDbError(error) || attempt === MAX_SEED_RETRIES) {
        throw error;
      }
      const backoffMs = attempt * 3000;
      console.warn(`Transient DB error during seed (attempt ${attempt}/${MAX_SEED_RETRIES}). Retrying in ${backoffMs}ms...`);
      await delay(backoffMs);
    }
  }
}

runSeedWithRetry().catch((e) => {
  console.error(e);
  process.exit(1);
});
