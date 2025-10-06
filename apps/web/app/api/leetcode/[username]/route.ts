import { NextResponse } from "next/server";
import { getLeetCodeFullStats } from "@/lib/services/leetcode/stats";

interface Params {
  username: string;
}

/**
 * GET /api/leetcode/[username]
 * Fetches LeetCode stats for a given username.
 * Handles both dev and production modes safely.
 */
export async function GET(
  req: Request,
  context: { params: Params | Promise<Params> }
) {
  try {
    // Resolve params (handles Promise in dev mode)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const username = resolvedParams?.username;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch stats (caching handled internally)
    const stats = await getLeetCodeFullStats(username);

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
