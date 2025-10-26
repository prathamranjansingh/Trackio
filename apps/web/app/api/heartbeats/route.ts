import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/upstash/redis";
import { prisma } from "@trackio/prisma";
import { z } from "zod";

const QUEUE_KEY = "tracker_queue";
const MAX_HEARTBEATS_PER_BATCH = 1000;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;

const HeartbeatSchema = z.object({
  time: z
    .number()
    .positive()
    .transform((val) => Math.floor(val)),
  project: z.string().min(1).max(255),
  language: z.string().max(50).optional(),
  category: z.enum(["coding", "debugging"]),
});

const PayloadSchema = z.object({
  heartbeats: z.array(HeartbeatSchema).min(1).max(MAX_HEARTBEATS_PER_BATCH),
  timezone: z.string().max(50).default("UTC"),
});

interface QueueMessage {
  userId: string;
  timezone: string;
  batch: z.infer<typeof HeartbeatSchema>[];
  timestamp: number;
}

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const rateLimitKey = `ratelimit:heartbeat:${userId}`;
    const current = await redis.incr(rateLimitKey);

    if (current === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    }

    return current <= RATE_LIMIT_MAX_REQUESTS;
  } catch {
    return true;
  }
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const plainTextApiKey = req.headers.get("x-api-key");

    if (!plainTextApiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    if (plainTextApiKey.length === 0 || plainTextApiKey.length > 256) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 401 }
      );
    }

    const hashedKey = hashApiKey(plainTextApiKey);

    const apiKeyRecord = await Promise.race([
      prisma.extensionApiKey.findUnique({
        where: { hashedKey },
        select: { userId: true },
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 5000)
      ),
    ]).catch(() => null);

    if (!apiKeyRecord) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    userId = apiKeyRecord.userId;

    const withinRateLimit = await checkRateLimit(userId);
    if (!withinRateLimit) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: RATE_LIMIT_WINDOW,
        },
        {
          status: 429,
          headers: {
            "Retry-After": RATE_LIMIT_WINDOW.toString(),
          },
        }
      );
    }

    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validationResult = PayloadSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid payload format",
          details: validationResult.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { heartbeats, timezone } = validationResult.data;

    if (!isValidTimezone(timezone)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    const queueMessage: QueueMessage = {
      userId,
      timezone,
      batch: heartbeats,
      timestamp: Date.now(),
    };

    try {
      await redis.lpush(QUEUE_KEY, queueMessage);
    } catch (redisError) {
      console.error(`[Heartbeat] Redis error for user ${userId}:`, redisError);
      return NextResponse.json(
        { error: "Failed to queue heartbeats" },
        { status: 503 }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `[Heartbeat] Queued ${heartbeats.length} heartbeats for user ${userId} (${processingTime}ms)`
    );

    return NextResponse.json(
      {
        message: "Batch accepted",
        count: heartbeats.length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error(`[Heartbeat] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
