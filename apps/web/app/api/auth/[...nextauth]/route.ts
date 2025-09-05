import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";
import { prisma } from "@trackio/prisma";
console.log("DATABASE_URL in runtime:", process.env.DATABASE_URL);

(async () => {
  try {
    const info = await prisma.$queryRawUnsafe<
      { db: string; host: string }[]
    >("SELECT current_database() as db, inet_server_addr() as host;");
    console.log("Actually connected to:", info);
  } catch (err) {
    console.error("DB connection check failed:", err);
  }
})();
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
