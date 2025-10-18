/*
  Warnings:

  - You are about to drop the `DailySummary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Heartbeat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DailySummary" DROP CONSTRAINT "DailySummary_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DailySummary" DROP CONSTRAINT "DailySummary_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Heartbeat" DROP CONSTRAINT "Heartbeat_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Heartbeat" DROP CONSTRAINT "Heartbeat_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "public"."ExtensionApiKey" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."DailySummary";

-- DropTable
DROP TABLE "public"."Heartbeat";

-- DropTable
DROP TABLE "public"."Project";

-- CreateTable
CREATE TABLE "public"."DailyProjectSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "language" TEXT,
    "category" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyProjectSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyActivityTotal" (
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_coding_seconds" INTEGER NOT NULL DEFAULT 0,
    "total_debugging_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyActivityTotal_pkey" PRIMARY KEY ("userId","date")
);

-- CreateIndex
CREATE INDEX "DailyProjectSummary_userId_date_idx" ON "public"."DailyProjectSummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyProjectSummary_userId_date_project_name_language_categ_key" ON "public"."DailyProjectSummary"("userId", "date", "project_name", "language", "category");

-- CreateIndex
CREATE INDEX "DailyActivityTotal_userId_date_idx" ON "public"."DailyActivityTotal"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."DailyProjectSummary" ADD CONSTRAINT "DailyProjectSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyActivityTotal" ADD CONSTRAINT "DailyActivityTotal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
