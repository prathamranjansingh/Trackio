"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@trackio/ui";
import { getInitials } from "@trackio/utils"; // Your modular function

type User = {
  name: string | null;
  username: string | null;
  image: string | null;
};

export function DashboardProfileCard({ user }: { user: User }) {
  const isProfileComplete = user.name && user.username;

  if (isProfileComplete) {
    // STATE 1: Profile is complete
    return (
      <div className="flex h-full flex-col items-center justify-evenly p-6 text-black">
        <div>
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.image || undefined} alt="Profile picture" />
            <AvatarFallback className="text-3xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-mono text-lg font-normal text-black">
            @{user.username}
          </h1>
        </div>
        <div>
          <p className="mt-4 text-center text-base font-mono">
            Hii{" "}
            <span className="font-extrabold">
              {user?.name
                ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                : ""}
            </span>{" "}
            your dashboard here, your unofficial hype squad. It's time to cook.
          </p>
        </div>
      </div>
    );
  }

  // STATE 2: Profile is incomplete
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg p-6 text-black">
      <Avatar className="h-24 w-24">
        <AvatarFallback className="text-3xl">👻</AvatarFallback>
      </Avatar>
      <h2 className="mt-4 text-2xl font-bold">
        Vibes incoming... but unnamed? No problem! Pick one and flex your
        digital swagger!
      </h2>
      <p className="mt-4 text-center text-sm text-gray-300">
        Your profile is incomplete. Set your name and a unique username to join
        the leaderboards.
      </p>
      <Button asChild className="mt-6">
        <Link href="/settings/profile">Go to Profile Settings</Link>
      </Button>
    </div>
  );
}
