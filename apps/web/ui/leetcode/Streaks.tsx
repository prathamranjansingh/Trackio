"use client";

import * as React from "react";
import useSWR from "swr";
import { Skeleton } from "@trackio/ui";

type LeetCodeStats = {
  streak: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Streaks({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<LeetCodeStats>(
    username ? `/api/leetcode/${username}` : null,
    fetcher
  );

  if (isLoading) {
    return <Skeleton className="h-4 w-[100px]" />;
  }

  if (error || !data) {
    return (
      <div className="text-red-800">
        <p>Error loading streak: {error?.message || "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="text-white text-6xl font-extrabold font-mono">
      {data.streak} 
    </div>
  );
}
