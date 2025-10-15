-- CreateTable
CREATE TABLE "public"."Heartbeat" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "language" TEXT,
    "time" TIMESTAMP(3) NOT NULL,
    "isWrite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "Heartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repositoryUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailySummary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalSeconds" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "language" TEXT NOT NULL,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Heartbeat_userId_time_idx" ON "public"."Heartbeat"("userId", "time");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_name_key" ON "public"."Project"("userId", "name");

-- CreateIndex
CREATE INDEX "DailySummary_userId_date_idx" ON "public"."DailySummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_userId_date_projectId_language_key" ON "public"."DailySummary"("userId", "date", "projectId", "language");

-- AddForeignKey
ALTER TABLE "public"."Heartbeat" ADD CONSTRAINT "Heartbeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Heartbeat" ADD CONSTRAINT "Heartbeat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySummary" ADD CONSTRAINT "DailySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailySummary" ADD CONSTRAINT "DailySummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
