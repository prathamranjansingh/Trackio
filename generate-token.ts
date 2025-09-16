import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { hashToken } from "./apps/web/lib/auth/hash-token";

const prisma = new PrismaClient();

async function generateApiToken() {
  // --- IMPORTANT ---
  // 1. Replace this with a real user ID from your database!
  const userId = "cmf74ldvf0000i3ds23bekrpt";
  // -----------------

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`🔴 Error: User with ID '${userId}' not found.`);
    return;
  }

  // 1. Create a new, secret token (this is what the user will see)
  const token = `sk_${randomBytes(24).toString("hex")}`;

  // 2. Create a secure hash of the token (this is what we store in the DB)
  const hashedToken = await hashToken(token);

  // 3. Save the HASHED token to the database
  await prisma.token.create({
    data: {
      userId: user.id,
      name: "My First Testing Token",
      hashedKey: hashedToken,
      partialKey: token.slice(-4), // Store the last 4 digits so the user can identify it
    },
  });

  console.log("✅ Token created successfully for user:", user.email);
  console.log("----------------------------------------------------");
  console.log("🔑 Copy this token and paste it into Postman:");
  console.log(token); // 4. Log the ORIGINAL token for you to copy
  console.log("----------------------------------------------------");
}

generateApiToken()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
