"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardContent } from "@trackio/ui";

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
    return (
      <Card className="bg-gray-50 border-gray-200 text-gray-800">
        <CardContent className="text-center">Loading...</CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <div className=" text-red-800">
          <p>Error loading stats: {error?.message || "No data available"}</p>
        </div>
    );
  }

  return (
    <div>
        Total Solved: {data.totalSolved}
    </div>
  );
}
