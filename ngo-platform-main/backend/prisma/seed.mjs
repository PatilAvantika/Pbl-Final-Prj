import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

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

  // ─── Passwords ───────────────────────────────────────────────────────────────
  const adminPwd  = await bcrypt.hash('Admin@1234', 10);
  const volPwd    = await bcrypt.hash('Volunteer@1234', 10);

  // ─── Users ───────────────────────────────────────────────────────────────────
  console.log('👤 Upserting users…');

  const admin = await prisma.user.upsert({
    where: { email: 'ananya.kapoor@sevasetu.demo' },
    update: {},
    create: { email: 'ananya.kapoor@sevasetu.demo', passwordHash: adminPwd, role: 'NGO_ADMIN',         firstName: 'Ananya',  lastName: 'Kapoor',  deviceId: 'device-admin-001', isActive: true },
  });

  const coord = await prisma.user.upsert({
    where: { email: 'rohan.das@sevasetu.demo' },
    update: {},
    create: { email: 'rohan.das@sevasetu.demo',    passwordHash: adminPwd, role: 'FIELD_COORDINATOR', firstName: 'Rohan',   lastName: 'Das',     deviceId: 'device-coord-001', isActive: true },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya.sharma@sevasetu.demo' },
    update: {},
    create: { email: 'priya.sharma@sevasetu.demo', passwordHash: volPwd,   role: 'VOLUNTEER',         firstName: 'Priya',   lastName: 'Sharma',  deviceId: 'device-vol-priya', isActive: true },
  });

  const arjun = await prisma.user.upsert({
    where: { email: 'arjun.mehta@sevasetu.demo' },
    update: {},
    create: { email: 'arjun.mehta@sevasetu.demo',  passwordHash: volPwd,   role: 'VOLUNTEER',         firstName: 'Arjun',   lastName: 'Mehta',   deviceId: 'device-vol-arjun', isActive: true },
  });

  // Keep legacy demo accounts for backward compatibility
  const legacyAdminHash = await bcrypt.hash('Demo1234!', 10);
  await prisma.user.upsert({
    where: { email: 'demo.user1@ngo.local' },
    update: {},
    create: { email: 'demo.user1@ngo.local', passwordHash: legacyAdminHash, role: 'NGO_ADMIN',         firstName: 'Demo', lastName: 'Admin', deviceId: 'demo-device-admin' },
  });
  await prisma.user.upsert({
    where: { email: 'demo.user2@ngo.local' },
    update: {},
    create: { email: 'demo.user2@ngo.local', passwordHash: legacyAdminHash, role: 'FIELD_COORDINATOR', firstName: 'Demo', lastName: 'Field', deviceId: 'demo-device-field' },
  });
  await prisma.user.upsert({
    where: { email: 'volunteer@fieldops.demo' },
    update: {},
    create: { email: 'volunteer@fieldops.demo', passwordHash: await bcrypt.hash('password123', 10), role: 'VOLUNTEER', firstName: 'Demo', lastName: 'Volunteer', deviceId: 'demo-device-volunteer' },
  });

  // ─── Tasks ───────────────────────────────────────────────────────────────────
  console.log('📋 Upserting tasks…');

  // Tasks don't have a natural unique key other than id, so we find-or-create by title
  let task1 = await prisma.task.findFirst({ where: { title: 'Tree Plantation Drive — Aarey Colony' } });
  if (!task1) {
    task1 = await prisma.task.create({ data: {
      title:          'Tree Plantation Drive — Aarey Colony',
      description:    'Plant native saplings across the designated plots in Aarey Colony. Each volunteer is responsible for 10 saplings. Bring water, gloves, and label sticks.',
      template:       'PLANTATION',
      zoneName:       'Aarey Colony Zone 3',
      geofenceLat:    19.1687,
      geofenceLng:    72.8794,
      geofenceRadius: 200,
      startTime:      d(0, 7, 0),
      endTime:        d(0, 13, 0),
      isActive:       true,
    }});
  }

  let task2 = await prisma.task.findFirst({ where: { title: 'Beach Cleanup Drive — Juhu Beach' } });
  if (!task2) {
    task2 = await prisma.task.create({ data: {
      title:          'Beach Cleanup Drive — Juhu Beach',
      description:    'Collect plastic waste, glass, and debris from the 1.2km stretch near Juhu beach entry. Sort waste into recyclable and non-recyclable bags provided at the site.',
      template:       'WASTE_COLLECTION',
      zoneName:       'Juhu Beach — North End',
      geofenceLat:    19.0968,
      geofenceLng:    72.8267,
      geofenceRadius: 300,
      startTime:      d(1, 6, 30),
      endTime:        d(1, 10, 30),
      isActive:       true,
    }});
  }

  // ─── Task Assignments ─────────────────────────────────────────────────────────
  console.log('🔗 Upserting task assignments…');

  for (const [userId, taskId] of [
    [priya.id, task1.id], [priya.id, task2.id],
    [arjun.id, task1.id], [arjun.id, task2.id],
    [admin.id, task1.id], [coord.id, task2.id],
  ]) {
    await prisma.taskAssignment.upsert({
      where:  { userId_taskId: { userId, taskId } },
      update: {},
      create: { userId, taskId },
    });
  }

  // ─── Attendance ───────────────────────────────────────────────────────────────
  console.log('📍 Upserting attendance records…');

  // Helper: upsert by uniqueRequestId
  const upsertAtt = (reqId, data) =>
    prisma.attendance.upsert({
      where:  { uniqueRequestId: reqId },
      update: {},
      create: { ...data, uniqueRequestId: reqId, syncStatus: 'SYNCED' },
    });

  // Priya — 8 days of attendance this month for a strong calendar visual
  const priyaAttendance = [
    // -6 days
    { reqId: 'priya-t1-d6-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(-6, 8, 5),  type: 'CLOCK_IN',  lat: 19.1688, lng: 72.8795, accuracyMeters: 10, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'priya-t1-d6-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-6, 12, 45), type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8795, accuracyMeters: 10, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    // -5 days
    { reqId: 'priya-t1-d5-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(-5, 7, 55),  type: 'CLOCK_IN',  lat: 19.1689, lng: 72.8793, accuracyMeters: 8,  deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'priya-t1-d5-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-5, 13, 10), type: 'CLOCK_OUT', lat: 19.1689, lng: 72.8793, accuracyMeters: 8,  deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    // -3 days
    { reqId: 'priya-t1-d3-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(-3, 8, 0),   type: 'CLOCK_IN',  lat: 19.1687, lng: 72.8794, accuracyMeters: 12, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'priya-t1-d3-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-3, 12, 55), type: 'CLOCK_OUT', lat: 19.1687, lng: 72.8794, accuracyMeters: 12, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    // -2 days
    { reqId: 'priya-t1-d2-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(-2, 8, 10),  type: 'CLOCK_IN',  lat: 19.1686, lng: 72.8796, accuracyMeters: 9,  deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'priya-t1-d2-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-2, 13, 5),  type: 'CLOCK_OUT', lat: 19.1686, lng: 72.8796, accuracyMeters: 9,  deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    // Yesterday
    { reqId: 'priya-t1-d1-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(-1, 7, 58),  type: 'CLOCK_IN',  lat: 19.1688, lng: 72.8795, accuracyMeters: 11, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'priya-t1-d1-out', data: { userId: priya.id, taskId: task1.id, timestamp: d(-1, 13, 0),  type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8795, accuracyMeters: 11, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
    // Today
    { reqId: 'priya-t1-d0-in',  data: { userId: priya.id, taskId: task1.id, timestamp: d(0, 8, 2),    type: 'CLOCK_IN',  lat: 19.1687, lng: 72.8794, accuracyMeters: 14, deviceId: 'device-vol-priya', reverseGeoName: 'Aarey Colony' }},
  ];

  // Arjun — 6 days of attendance
  const arjunAttendance = [
    // -5 days
    { reqId: 'arjun-t1-d5-in',  data: { userId: arjun.id, taskId: task1.id, timestamp: d(-5, 8, 20),  type: 'CLOCK_IN',  lat: 19.1690, lng: 72.8792, accuracyMeters: 15, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'arjun-t1-d5-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-5, 12, 30), type: 'CLOCK_OUT', lat: 19.1690, lng: 72.8792, accuracyMeters: 15, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    // -4 days
    { reqId: 'arjun-t1-d4-in',  data: { userId: arjun.id, taskId: task1.id, timestamp: d(-4, 7, 45),  type: 'CLOCK_IN',  lat: 19.1691, lng: 72.8793, accuracyMeters: 10, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'arjun-t1-d4-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-4, 12, 40), type: 'CLOCK_OUT', lat: 19.1691, lng: 72.8793, accuracyMeters: 10, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    // -2 days
    { reqId: 'arjun-t1-d2-in',  data: { userId: arjun.id, taskId: task1.id, timestamp: d(-2, 8, 5),   type: 'CLOCK_IN',  lat: 19.1688, lng: 72.8794, accuracyMeters: 13, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'arjun-t1-d2-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-2, 13, 15), type: 'CLOCK_OUT', lat: 19.1688, lng: 72.8794, accuracyMeters: 13, deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    // Yesterday
    { reqId: 'arjun-t1-d1-in',  data: { userId: arjun.id, taskId: task1.id, timestamp: d(-1, 8, 0),   type: 'CLOCK_IN',  lat: 19.1687, lng: 72.8795, accuracyMeters: 9,  deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
    { reqId: 'arjun-t1-d1-out', data: { userId: arjun.id, taskId: task1.id, timestamp: d(-1, 12, 50), type: 'CLOCK_OUT', lat: 19.1687, lng: 72.8795, accuracyMeters: 9,  deviceId: 'device-vol-arjun', reverseGeoName: 'Aarey Colony' }},
  ];

  for (const { reqId, data } of [...priyaAttendance, ...arjunAttendance]) {
    await upsertAtt(reqId, data);
  }

  // ─── Field Reports ────────────────────────────────────────────────────────────
  console.log('📝 Upserting field reports…');

  const priyaReportCount = await prisma.fieldReport.count({ where: { userId: priya.id } });
  if (priyaReportCount === 0) {
    await prisma.fieldReport.createMany({ data: [
      {
        taskId:        task1.id,
        userId:        priya.id,
        quantityItems: 22,
        notes:         'Planted 22 native saplings including Neem, Peepal, and Karanj varieties across Plot 3C. Soil was dry — added water from the tank. All saplings labelled and logged.',
        status:        'APPROVED',
        approvedById:  admin.id,
        approvedAt:    d(-3, 15, 0),
        timestamp:     d(-3, 13, 10),
      },
      {
        taskId:        task1.id,
        userId:        priya.id,
        quantityItems: 18,
        notes:         'Completed second plantation round at Plot 3D. Some saplings from yesterday\'s batch needed re-staking due to wind. Flagged 3 damaged saplings for replacement.',
        status:        'SUBMITTED',
        timestamp:     d(-1, 13, 5),
      },
    ]});
  }

  const arjunReportCount = await prisma.fieldReport.count({ where: { userId: arjun.id } });
  if (arjunReportCount === 0) {
    await prisma.fieldReport.createMany({ data: [
      {
        taskId:        task1.id,
        userId:        arjun.id,
        quantityItems: 19,
        notes:         'Cleared 19 large waste bags from the north end of the site. Found significant polythene accumulation near the drain — reported to zone supervisor. Waste segregation done at collection point.',
        status:        'APPROVED',
        approvedById:  admin.id,
        approvedAt:    d(-4, 16, 30),
        timestamp:     d(-4, 12, 45),
      },
      {
        taskId:        task1.id,
        userId:        arjun.id,
        quantityItems: 25,
        notes:         'Good turnout at today\'s cleanup. Collected 25 bags total — 16 recyclable, 9 non-recyclable. Team spirits high. Suggest increasing frequency at this zone.',
        status:        'SUBMITTED',
        timestamp:     d(-1, 12, 55),
      },
    ]});
  }

  // ─── Leaves ───────────────────────────────────────────────────────────────────
  console.log('🗓  Upserting leave records…');

  const priyaLeaveCount = await prisma.leave.count({ where: { userId: priya.id } });
  if (priyaLeaveCount === 0) {
    await prisma.leave.createMany({ data: [
      {
        userId:    priya.id,
        type:      'CASUAL',
        startDate: d(5),
        endDate:   d(6),
        status:    'PENDING',
        reason:    'Family function — sister\'s engagement ceremony in Pune. Will be travelling back by Sunday evening.',
      },
      {
        userId:    priya.id,
        type:      'SICK',
        startDate: d(-10),
        endDate:   d(-9),
        status:    'APPROVED',
        reason:    'Fever and throat infection — resting on doctor\'s advice. Medical certificate will be submitted on return.',
      },
    ]});
  }

  const arjunLeaveCount = await prisma.leave.count({ where: { userId: arjun.id } });
  if (arjunLeaveCount === 0) {
    await prisma.leave.createMany({ data: [
      {
        userId:    arjun.id,
        type:      'CASUAL',
        startDate: d(10),
        endDate:   d(11),
        status:    'APPROVED',
        reason:    'Personal work — need to appear for a local government document process. Only available on these two days.',
      },
      {
        userId:    arjun.id,
        type:      'UNPAID',
        startDate: d(20),
        endDate:   d(22),
        status:    'PENDING',
        reason:    'Village visit for grandmother\'s 80th birthday celebration. Extended family gathering — need 3 days.',
      },
    ]});
  }

  // ─── AuditLogs ────────────────────────────────────────────────────────────────
  console.log('📊 Upserting audit logs…');

  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    await prisma.auditLog.createMany({ data: [
      { actorId: admin.id, action: 'USER_CREATED',  entityType: 'User', entityId: priya.id, metadata: { note: 'Volunteer Priya Sharma onboarded' }, createdAt: d(-30) },
      { actorId: admin.id, action: 'USER_CREATED',  entityType: 'User', entityId: arjun.id, metadata: { note: 'Volunteer Arjun Mehta onboarded' }, createdAt: d(-29) },
      { actorId: coord.id, action: 'TASK_CREATED',  entityType: 'Task', entityId: task1.id, metadata: { note: 'Tree plantation task created' }, createdAt: d(-7) },
      { actorId: coord.id, action: 'TASK_CREATED',  entityType: 'Task', entityId: task2.id, metadata: { note: 'Beach cleanup task created' }, createdAt: d(-6) },
      { actorId: coord.id, action: 'TASK_ASSIGNED', entityType: 'Task', entityId: task1.id, metadata: { assignedTo: priya.id }, createdAt: d(-7) },
      { actorId: coord.id, action: 'TASK_ASSIGNED', entityType: 'Task', entityId: task1.id, metadata: { assignedTo: arjun.id }, createdAt: d(-7) },
      { actorId: admin.id, action: 'REPORT_STATUS_UPDATED', entityType: 'FieldReport', entityId: 'seed-report-1', metadata: { status: 'APPROVED', vol: priya.email }, createdAt: d(-3) },
      { actorId: admin.id, action: 'LEAVE_STATUS_UPDATED',  entityType: 'Leave', entityId: 'seed-leave-1',  metadata: { status: 'APPROVED', vol: priya.email }, createdAt: d(-9) },
    ]});
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
