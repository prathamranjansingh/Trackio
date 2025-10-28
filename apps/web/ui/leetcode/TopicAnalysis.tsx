"use client";

import * as React from "react";
import useSWR from "swr";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
} from "@trackio/ui";

// Type definitions
type TagProblemCount = {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
};

type LeetCodeStats = {
  username: string;
  tagProblemCounts: {
    advanced: TagProblemCount[];
    intermediate: TagProblemCount[];
    fundamental: TagProblemCount[];
  };
};

// Chart configuration
const chartConfig = {
  problemsSolved: {
    label: "Problems Solved",
  },
  fundamental: {
    label: "Fundamental",
    color: "hsl(var(--chart-1))",
  },
  intermediate: {
    label: "Intermediate",
    color: "hsl(var(--chart-2))",
  },
  advanced: {
    label: "Advanced",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TopicAnalysis({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<LeetCodeStats>(
    username ? `/api/leetcode/${username}` : null,
    fetcher
  );

  const [activeLevel, setActiveLevel] =
    React.useState<keyof LeetCodeStats["tagProblemCounts"]>("fundamental");

  const totals = React.useMemo(() => {
    if (!data) return null;
    return {
      fundamental: data.tagProblemCounts.fundamental.reduce(
        (acc, curr) => acc + curr.problemsSolved,
        0
      ),
      intermediate: data.tagProblemCounts.intermediate.reduce(
        (acc, curr) => acc + curr.problemsSolved,
        0
      ),
      advanced: data.tagProblemCounts.advanced.reduce(
        (acc, curr) => acc + curr.problemsSolved,
        0
      ),
    };
  }, [data]);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [...data.tagProblemCounts[activeLevel]].sort(
      (a, b) => b.problemsSolved - a.problemsSolved
    );
  }, [data, activeLevel]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </div>
    );
  }

  if (error || !data || !totals) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-sm text-muted-foreground">
        <div>
          ⚠️ Could not load LeetCode analysis for <b>{username}</b>
        </div>
        <div className="mt-1 text-xs">
          {error?.message || "No data available."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono h-full justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch border-b border-border/20">
        <div className="flex-1 flex flex-col justify-center gap-1 px-6 py-4">
          <h2 className="text-lg font-semibold font-mono">
            DSA Topic Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Breakdown by difficulty level
          </p>
        </div>

        {/* Buttons */}
        <div className="flex ">
          {(["fundamental", "intermediate", "advanced"] as const).map(
            (level) => (
              <button
                key={level}
                data-active={activeLevel === level}
                className={`flex flex-1 flex-col justify-center gap-1 
                 px-2 py-2 sm:px-6 sm:py-4 text-left transition-colors
                 min-w-0 sm:min-w-[0] data-[active=true]:bg-muted/60 hover:bg-muted/40`}
                onClick={() => setActiveLevel(level)}
              >
                <span className="text-xs sm:text-xs text-muted-foreground">
                  {chartConfig[level].label}
                </span>
                <span className="text-sm sm:text-2xl font-bold leading-none">
                  {totals[level].toLocaleString()}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 flex items-center justify-center px-3 pt-4 sm:p-6 overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="w-full h-[200px] max-w-full overflow-hidden"
        >
          <LineChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 10, bottom: 40 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tagName"
              tickLine={false}
              axisLine={true}
              tick={false}
              label={{
                value: "Topics",
                position: "bottom",
                offset: 10,
                style: { fontSize: 14, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={30}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(label: string) =>
                    chartData.find((item) => item.tagName === label)?.tagName ||
                    label
                  }
                />
              }
            />
            <Line
              dataKey="problemsSolved"
              type="monotone"
              stroke={chartConfig[activeLevel].color}
              strokeWidth={2}
              dot={{ fill: chartConfig[activeLevel].color }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
