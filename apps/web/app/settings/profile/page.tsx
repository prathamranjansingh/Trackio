import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@trackio/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@trackio/ui";
import { ProfileForm } from "@/ui/profile/ProfileForm";

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch fresh data from the DB. This is more reliable
  // than the session, which might be stale.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pass the server-fetched data to the client form */}
          <ProfileForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
