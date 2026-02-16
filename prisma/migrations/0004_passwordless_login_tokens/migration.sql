-- AlterTable
ALTER TABLE "User" ADD COLUMN "needsDisplayName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_tokenHash_key" ON "LoginToken"("tokenHash");
CREATE INDEX "LoginToken_email_idx" ON "LoginToken"("email");
CREATE INDEX "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");
