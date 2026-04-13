-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "onboardingProfileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingFaceComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingAttendanceIntroComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "faceEnrollmentSamples" JSONB;

-- Existing accounts skip the wizard
UPDATE "User" SET
  "onboardingProfileComplete" = true,
  "onboardingFaceComplete" = true,
  "onboardingAttendanceIntroComplete" = true
WHERE true;
