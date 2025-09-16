/*
  Warnings:

  - You are about to drop the column `defaultPartnerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `defaultWorkspace` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_defaultWorkspace_idx";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "defaultPartnerId",
DROP COLUMN "defaultWorkspace";

-- CreateTable
CREATE TABLE "public"."CodingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodingProfile_userId_idx" ON "public"."CodingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProfile_provider_username_key" ON "public"."CodingProfile"("provider", "username");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProfile_provider_userId_key" ON "public"."CodingProfile"("provider", "userId");

-- AddForeignKey
ALTER TABLE "public"."CodingProfile" ADD CONSTRAINT "CodingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
