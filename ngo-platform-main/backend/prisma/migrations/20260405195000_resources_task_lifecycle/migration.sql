-- Task lifecycle (field-ops state machine)
CREATE TYPE "TaskLifecycleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Task" ADD COLUMN "lifecycleStatus" "TaskLifecycleStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Task" SET "lifecycleStatus" = CASE
  WHEN "isActive" = false AND "endTime" < NOW() THEN 'COMPLETED'::"TaskLifecycleStatus"
  WHEN "isActive" = false THEN 'CANCELLED'::"TaskLifecycleStatus"
  WHEN "startTime" > NOW() THEN 'PENDING'::"TaskLifecycleStatus"
  ELSE 'ACTIVE'::"TaskLifecycleStatus"
END;

CREATE INDEX "Task_lifecycleStatus_idx" ON "Task"("lifecycleStatus");

-- Resources (merged from legacy Express backend)
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Resource_organizationId_idx" ON "Resource"("organizationId");

ALTER TABLE "Resource" ADD CONSTRAINT "Resource_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ResourceAllocation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResourceAllocation_taskId_idx" ON "ResourceAllocation"("taskId");
CREATE INDEX "ResourceAllocation_resourceId_idx" ON "ResourceAllocation"("resourceId");

ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
