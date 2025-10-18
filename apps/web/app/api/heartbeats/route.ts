import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { redis } from "@/lib/upstash/redis";
import { prisma } from "@trackio/prisma";

const QUEUE_KEY = "tracker_queue";

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export async function POST(req: NextRequest) {
  const plainTextApiKey = req.headers.get("x-api-key");
  if (!plainTextApiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 });
  }

  const incomingHashedKey = hashApiKey(plainTextApiKey);

  let apiKeyRecord;
  try {
    apiKeyRecord = await prisma.extensionApiKey.findUnique({
      where: { hashedKey: incomingHashedKey },
      select: { userId: true },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
  } catch (dbError) {
    console.error("Heartbeat API: DB error validating key:", dbError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  try {
    const rawBody = await req.text();
    const bodyPayload = JSON.parse(rawBody);

    if (!bodyPayload.heartbeats || !Array.isArray(bodyPayload.heartbeats)) {
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    const messageForQueue = JSON.stringify({
      userId: apiKeyRecord.userId,
      timezone: bodyPayload.timezone || "UTC",
      batch: bodyPayload.heartbeats,
    });

    await redis.lpush(QUEUE_KEY, messageForQueue);

    return NextResponse.json({ message: "Batch accepted" }, { status: 202 });
  } catch (error) {
    console.error(
      `Heartbeat API: Failed to queue batch for user ${apiKeyRecord.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to queue batch" },
      { status: 500 }
    );
  }
}
