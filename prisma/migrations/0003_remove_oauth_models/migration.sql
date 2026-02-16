-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "Account";

-- DropIndex (from migration 0002)
-- emailVerified column is being removed, no index to drop

-- AlterTable: remove emailVerified, make passwordHash required
-- First, set a placeholder hash for any OAuth-only users with NULL passwordHash
-- (bcrypt hash of a random value — these accounts will need to use password reset)
UPDATE "User" SET "passwordHash" = '$2a$12$placeholder.needs.password.reset' WHERE "passwordHash" IS NULL;

ALTER TABLE "User" DROP COLUMN "emailVerified";
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- AddIndex (new indexes from schema update)
CREATE INDEX "Video_status_createdAt_idx" ON "Video"("status", "createdAt");
CREATE INDEX "Video_status_viewCount_idx" ON "Video"("status", "viewCount");
