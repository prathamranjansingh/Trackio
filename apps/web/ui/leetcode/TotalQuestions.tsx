"use client";

import * as React from "react";
import useSWR from "swr";
import { Skeleton } from "@trackio/ui";

type LeetCodeStats = {
  totalSolved: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TotalSolved({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<LeetCodeStats>(
    username ? `/api/leetcode/${username}` : null,
    fetcher
  );

  if (isLoading) {
    return <Skeleton className="h-4 w-[250px]" />;
  }

  if (error || !data) {
    return (
      <div className=" text-red-800">
        <p>Error loading stats: {error?.message || "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="text-[#450102] text-8xl font-obviously">
      {data.totalSolved}
    </div>
  );
}
