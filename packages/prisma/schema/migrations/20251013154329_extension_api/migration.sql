-- CreateTable
CREATE TABLE "public"."ExtensionApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "partialKey" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ExtensionApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionApiKey_hashedKey_key" ON "public"."ExtensionApiKey"("hashedKey");

-- CreateIndex
CREATE INDEX "ExtensionApiKey_userId_idx" ON "public"."ExtensionApiKey"("userId");

-- AddForeignKey
ALTER TABLE "public"."ExtensionApiKey" ADD CONSTRAINT "ExtensionApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
