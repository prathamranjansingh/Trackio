"use client";

import * as React from "react";
import useSWR from "swr";
import { CalendarHeatmap, Skeleton } from "@trackio/ui";
import { cn } from "@trackio/ui";

interface SubmissionCalendar {
  [timestamp: string]: number;
}

interface LeetCodeApiResponse {
  username: string;
  submissionCalendar: string;
}

interface WeightedDate {
  date: Date;
  weight: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  });

/* ----------------------------- ⚙️ Parser ----------------------------- */
function parseSubmissionCalendar(calendarString?: string): WeightedDate[] {
  if (!calendarString) return [];
  try {
    const calendar: SubmissionCalendar = JSON.parse(calendarString);
    return Object.entries(calendar).map(([timestamp, submissions]) => ({
      date: new Date(Number(timestamp) * 1000),
      weight: submissions,
    }));
  } catch {
    return [];
  }
}

/* ----------------------------- 🎨 Variants ----------------------------- */
const LeetCodeVariants = [
  "text-white hover:text-white bg-green-400 hover:bg-green-400",
  "text-white hover:text-white bg-green-500 hover:bg-green-500",
  "text-white hover:text-white bg-green-700 hover:bg-green-700",
];

function mapWeightsToVariants(
  weightedDates: WeightedDate[],
  variants: string[]
) {
  if (weightedDates.length === 0) return [];

  const weights = weightedDates.map((d) => d.weight);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const step = (max - min) / variants.length || 1;

  return Array.from({ length: variants.length }, (_, i) =>
    weightedDates.filter((d) => {
      const idx = Math.floor((d.weight - min) / step);
      return idx === i;
    })
  );
}

export default function LeetCodeHeatmap({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<LeetCodeApiResponse>(
    username ? `/api/leetcode/${username}` : null,
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 3 }
  );

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-md" />;

  if (error || !data)
    return (
      <div className="p-4 text-sm text-red-500 bg-red-950/30 rounded-lg">
        Failed to load LeetCode heatmap —{" "}
        {error?.message ?? "No data available."}
      </div>
    );

  const weightedDates = parseSubmissionCalendar(data.submissionCalendar);
  const datesPerVariant = mapWeightsToVariants(weightedDates, [
    ...LeetCodeVariants,
  ]);

  return (
    <div className="w-full flex flex-col items-center">
      <CalendarHeatmap
        className={cn("lg:motion-safe:[animation-delay:1000ms]")}
        variantClassnames={LeetCodeVariants}
        datesPerVariant={datesPerVariant.map((group) =>
          group.map((d) => d.date)
        )}
      />
    </div>
  );
}
