import { cacheData, getCachedData } from "@/lib/upstash/cache";
import { ratelimit } from "@/lib/upstash/ratelimit";
import { LEETCODE_FULL_STATS_QUERY } from "./graphql";

const limiter = ratelimit(3, "1 m");
const ENDPOINT = "https://leetcode.com/graphql";

async function fetchGraphQL<T>(query: string, variables: any): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Unknown GraphQL error");
  return json.data;
}

/**
 * Fetch LeetCode stats with caching and rate limiting
 */
export async function getLeetCodeFullStats(username: string) {
  const cacheKey = `leetcode:full:${username.toLowerCase()}`;
  const cached = await getCachedData<any>(cacheKey);
  const DEV_MODE = process.env.NODE_ENV === "development";

  if (cached) {
    console.log(`[CACHE HIT] Stats for ${username}`);
    revalidateInBackground(username, cacheKey); // Refresh in background
    return cached;
  } else {
    console.log(`[CACHE MISS] Fetching fresh data for ${username}`);
  }

  // // Rate limiting for fresh fetch
  // if (!DEV_MODE) {
  //   const { success } = await limiter.limit(`lc:${username}`);
  //   if (!success) {
  //     if (cached) return cached; // serve stale if available
  //     throw new Error("Rate limit exceeded. Try again later.");
  //   }
  // }

  const data = await fetchGraphQL<any>(LEETCODE_FULL_STATS_QUERY, { username });
  const stats = transformUserData(data);

  await cacheData(cacheKey, stats, 60 * 30); // cache for 30 min
  console.log(`[CACHE STORE] Stats stored for ${username}`);

  return stats;
}

/**
 * Transform raw GraphQL response into our model
 */
function transformUserData(json: any) {
  const mu = json.matchedUser;
  if (!mu) throw new Error("User not found");

  const ac = mu.submitStatsGlobal?.acSubmissionNum || [];
  const map: Record<string, number> = {};
  ac.forEach((d: any) => (map[d.difficulty.toLowerCase()] = d.count));

  return {
    username: mu.username,
    totalSolved: (map["easy"] || 0) + (map["medium"] || 0) + (map["hard"] || 0),
    easySolved: map["easy"] || 0,
    mediumSolved: map["medium"] || 0,
    hardSolved: map["hard"] || 0,
    streak: mu.userCalendar?.streak || 0,
    badges: mu.userCalendar?.dccBadges.map((b: any) => ({
      name: b.badge.name,
      icon: b.badge.icon,
      timestamp: b.timestamp,
    })) || [],
    ranking: mu.profile?.ranking || null,
    contributionPoints: mu.profile?.contributionPoints || null,
    reputation: mu.profile?.reputation || null,
  };
}

/**
 * Background revalidation (non-blocking)
 */
async function revalidateInBackground(username: string, cacheKey: string) {
  try {
    const data = await fetchGraphQL<any>(LEETCODE_FULL_STATS_QUERY, { username });
    const stats = transformUserData(data);
    await cacheData(cacheKey, stats, 60 * 30);
    console.log(`[CACHE REFRESH] Background refresh complete for ${username}`);
  } catch (err) {
    console.error(`[CACHE REFRESH ERROR] Failed to refresh ${username}:`, err);
  }
}
