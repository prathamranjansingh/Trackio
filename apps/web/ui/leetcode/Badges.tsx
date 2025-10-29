"use client";

import * as React from "react";
import useSWR from "swr";
import { Skeleton } from "@trackio/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@trackio/ui";

type MedalConfig = {
  iconGif: string;
  iconGifBackground: string;
};

type Medal = {
  slug: string;
  config: MedalConfig;
};

type Badge = {
  id: string;
  name: string;
  shortName: string;
  displayName: string;
  icon: string;
  hoverText: string;
  medal?: Medal;
  creationDate: number;
  category: string;
};

type LeetCodeBadgeStats = {
  badges: Badge[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Badges({ username }: { username: string }) {
  const { data, error, isLoading } = useSWR<LeetCodeBadgeStats>(
    username ? `/api/leetcode/${username}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-6 w-[160px]" />
        <div className="flex gap-3 flex-wrap justify-center">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-red-500 text-sm text-center">
        Error loading badges: {error?.message || "No data available"}
      </div>
    );
  }

  const badges = (data.badges || []).slice(0, 3); // Take only first 3 badges
  const totalBadges = data.badges?.length || 0;

  const getBadgeIconUrl = (badge: Badge) => {
    const icon = badge.medal?.config?.iconGif || badge.icon;
    if (!icon) return "";
    return icon.startsWith("http") ? icon : `https://leetcode.com/${icon}`;
  };

  return (
    <TooltipProvider>
      <div className="text-black flex flex-col items-center space-y-6 font-mono p-2">
        {/* Total badge count */}

        <div className="flex flex-col text-sm text-center font-light font-mono pt-4">
          <div>Badges </div>
          <div className="font-bold text-3xl">{totalBadges}</div>
        </div>

        {badges.length === 0 ? (
          <p className="text-gray-400 text-sm">No badges earned yet.</p>
        ) : (
          <div className="flex flex-nowrap justify-center gap-4">
            {badges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 w-32 [@media(min-width:1020px)]:w-20 [@media(min-width:1300px)]:w-32 cursor-pointer hover:scale-105 transition-transform">
                    <img
                      src={getBadgeIconUrl(badge)}
                      alt={badge.displayName || badge.name}
                      className="w-20 h-20 [@media(min-width:1020px)]:w-12 [@media(min-width:1020px)]:h-12 [@media(min-width:1300px)]:w-20 [@media(min-width:1300px)]:h-20 mb-2"
                      style={{
                        filter:
                          "drop-shadow(0 0 0 black) drop-shadow(0 0 5px black)",
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-center">
                  <p className="font-semibold">
                    {badge.displayName || badge.name}
                  </p>
                  <p className="text-xs text-gray-400">{badge.hoverText}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
