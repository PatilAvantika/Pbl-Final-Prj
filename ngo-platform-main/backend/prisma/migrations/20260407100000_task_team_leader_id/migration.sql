-- AlterTable
ALTER TABLE "Task" ADD COLUMN "teamLeaderId" TEXT;

-- CreateIndex
CREATE INDEX "Task_teamLeaderId_idx" ON "Task"("teamLeaderId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
