import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto"; // Node.js crypto module for hashing
import { redis } from "@/lib/upstash/redis"; // Your configured Upstash Redis client
import { prisma } from "@trackio/prisma"; // Your Prisma client instance

// Define the queue key in Redis
const QUEUE_KEY = "tracker_queue";

/**
 * Hashes an API key using SHA-256.
 * @param apiKey The plain-text API key.
 * @returns The hexadecimal representation of the hash.
 */
function hashApiKey(apiKey: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(apiKey);
  return hash.digest("hex");
}

// Main API handler for POST requests
export async function POST(req: NextRequest) {
  // 1. Get the plain-text API key from the 'x-api-key' header
  const plainTextApiKey = req.headers.get("x-api-key");

  if (!plainTextApiKey) {
    console.warn("Heartbeat API: Missing X-Api-Key header");
    return NextResponse.json({ error: "API key is required" }, { status: 401 });
  }

  // 2. Hash the incoming key immediately for comparison
  const incomingHashedKey = hashApiKey(plainTextApiKey);

  // 3. Validate the hashed key against the database
  let apiKeyRecord;
  try {
    apiKeyRecord = await prisma.extensionApiKey.findUnique({
      where: { hashedKey: incomingHashedKey }, // Query by the hashed value
      select: { userId: true }, // Only fetch the user ID
    });

    if (!apiKeyRecord) {
      // Log only a portion of the hash for security
      console.warn(
        `Heartbeat API: Invalid API Key received (hash mismatch): ${incomingHashedKey.substring(0, 10)}...`
      );
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
  } catch (dbError) {
    console.error(
      "Heartbeat API: Database error during API key validation:",
      dbError
    );
    return NextResponse.json(
      { error: "Internal server error validating key" },
      { status: 500 }
    );
  }

  // 4. Read the raw request body (the heartbeat batch JSON string)
  let rawBody: string;
  let parsedBatch: unknown; // To hold the parsed JSON for the queue message
  try {
    rawBody = await req.text();
    if (!rawBody || rawBody.trim() === "") {
      console.log(
        `Heartbeat API: Received empty request body for user ${apiKeyRecord.userId}.`
      );
      return NextResponse.json(
        { message: "Empty batch received" },
        { status: 200 }
      );
    }
    // Basic format validation
    if (!rawBody.startsWith("[") || !rawBody.endsWith("]")) {
      console.warn(
        `Heartbeat API: Received non-array body for user ${apiKeyRecord.userId}.`
      );
      return NextResponse.json(
        { error: "Invalid batch format, expected JSON array" },
        { status: 400 }
      );
    }
    // Attempt to parse to ensure it's valid JSON before queueing
    parsedBatch = JSON.parse(rawBody);
  } catch (error) {
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      console.error(
        `Heartbeat API: Error parsing JSON body for user ${apiKeyRecord.userId}:`,
        error.message
      );
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }
    console.error(
      `Heartbeat API: Error reading request body for user ${apiKeyRecord.userId}:`,
      error
    );
    return NextResponse.json(
      { error: "Could not read request body" },
      { status: 400 }
    );
  }

  // 5. Prepare the message payload for the queue (including userId)
  const messagePayload = JSON.stringify({
    userId: apiKeyRecord.userId, // Include the user ID for the worker
    batch: parsedBatch, // Include the already parsed batch array
  });

  // 6. Push the payload string to the Upstash Redis Queue (List)
  try {
    const pushResult = await redis.lpush(QUEUE_KEY, messagePayload);
    console.log(
      `Heartbeat API: Pushed batch for user ${apiKeyRecord.userId}. New queue length: ${pushResult}`
    );

    // 7. Return "Accepted" status
    return NextResponse.json(
      { message: "Batch accepted for processing" },
      { status: 202 }
    );
  } catch (redisError) {
    console.error(
      `Heartbeat API: Failed to push batch to Redis queue for user ${apiKeyRecord.userId}:`,
      redisError
    );
    // This is critical; the data wasn't saved. Consider retry logic or alarming.
    return NextResponse.json(
      { error: "Failed to queue batch for processing" },
      { status: 500 }
    );
  }
}

// Optional: Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "API is running" });
}
