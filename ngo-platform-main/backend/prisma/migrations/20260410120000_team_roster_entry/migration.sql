-- CreateTable
CREATE TABLE "TeamRosterEntry" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRosterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamRosterEntry_leaderId_volunteerId_key" ON "TeamRosterEntry"("leaderId", "volunteerId");

-- CreateIndex
CREATE INDEX "TeamRosterEntry_leaderId_idx" ON "TeamRosterEntry"("leaderId");

-- AddForeignKey
ALTER TABLE "TeamRosterEntry" ADD CONSTRAINT "TeamRosterEntry_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRosterEntry" ADD CONSTRAINT "TeamRosterEntry_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
