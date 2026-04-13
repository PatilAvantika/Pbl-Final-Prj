-- User timezone for volunteer dashboard (IANA)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';

-- Attendance: dashboard range scans by user + time
CREATE INDEX IF NOT EXISTS "Attendance_userId_timestamp_idx" ON "Attendance"("userId", "timestamp");

-- TaskAssignment: counts by user + joined task filters
CREATE INDEX IF NOT EXISTS "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- Task: org + lifecycle for assignment joins
CREATE INDEX IF NOT EXISTS "Task_organizationId_lifecycleStatus_idx" ON "Task"("organizationId", "lifecycleStatus");
