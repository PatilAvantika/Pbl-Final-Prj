-- Neon / partial DBs: base tables may exist without Organization, organizationId, or DonorCampaign.
-- This migration is idempotent where possible.

-- DonorCampaignStatus enum
DO $$ BEGIN
    CREATE TYPE "DonorCampaignStatus" AS ENUM ('ACTIVE', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
INSERT INTO "Organization" ("id", "name", "slug")
VALUES ('00000000-0000-4000-8000-000000000001', 'Default Organization', 'default')
ON CONFLICT ("slug") DO NOTHING;

-- User.organizationId
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "User" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- Task.organizationId
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "Task" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "organizationId" SET NOT NULL;
DO $$ BEGIN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Task_organizationId_idx" ON "Task"("organizationId");

-- FieldReport.organizationId
ALTER TABLE "FieldReport" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
UPDATE "FieldReport" fr SET "organizationId" = t."organizationId" FROM "Task" t WHERE fr."taskId" = t."id" AND fr."organizationId" IS NULL;
UPDATE "FieldReport" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "FieldReport" ALTER COLUMN "organizationId" SET NOT NULL;
DO $$ BEGIN
    ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "FieldReport_organizationId_idx" ON "FieldReport"("organizationId");

-- DonorCampaign (full table as in current schema)
CREATE TABLE IF NOT EXISTS "DonorCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "zoneName" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "DonorCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DonorCampaign_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DonorCampaign_taskId_key" ON "DonorCampaign"("taskId");
CREATE INDEX IF NOT EXISTS "DonorCampaign_status_idx" ON "DonorCampaign"("status");
CREATE INDEX IF NOT EXISTS "DonorCampaign_organizationId_idx" ON "DonorCampaign"("organizationId");
DO $$ BEGIN
    ALTER TABLE "DonorCampaign" ADD CONSTRAINT "DonorCampaign_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "DonorCampaign" ADD CONSTRAINT "DonorCampaign_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Donation
CREATE TABLE IF NOT EXISTS "Donation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Donation_donorId_idx" ON "Donation"("donorId");
CREATE INDEX IF NOT EXISTS "Donation_campaignId_idx" ON "Donation"("campaignId");
CREATE INDEX IF NOT EXISTS "Donation_createdAt_idx" ON "Donation"("createdAt");
DO $$ BEGIN
    ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey"
      FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey"
      FOREIGN KEY ("campaignId") REFERENCES "DonorCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CampaignReport
CREATE TABLE IF NOT EXISTS "CampaignReport" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CampaignReport_campaignId_reportId_key" ON "CampaignReport"("campaignId", "reportId");
CREATE INDEX IF NOT EXISTS "CampaignReport_reportId_idx" ON "CampaignReport"("reportId");
DO $$ BEGIN
    ALTER TABLE "CampaignReport" ADD CONSTRAINT "CampaignReport_campaignId_fkey"
      FOREIGN KEY ("campaignId") REFERENCES "DonorCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "CampaignReport" ADD CONSTRAINT "CampaignReport_reportId_fkey"
      FOREIGN KEY ("reportId") REFERENCES "FieldReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AuditAction enum values (for donor audit)
DO $$ BEGIN
    ALTER TYPE "AuditAction" ADD VALUE 'DONOR_REPORTS_LIST_VIEWED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TYPE "AuditAction" ADD VALUE 'DONOR_REPORT_PDF_DOWNLOADED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
