import DashboardGrid from "@/ui/dashboard/DashboardGrid";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@trackio/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen text-white">
      <DashboardGrid user={user} />
    </main>
  );
}
