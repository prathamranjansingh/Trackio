import { NextResponse } from "next/server";
import { prisma } from "@trackio/prisma";
import { createHash } from "crypto";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function POST(request: Request) {
  const rawApiKey = request.headers.get("x-api-key");

  // ADD THIS LOG to see the exact key the extension is sending.
  console.log("Raw API Key received from header:", rawApiKey);

  if (!rawApiKey) {
    return NextResponse.json({ error: "API Key is missing" }, { status: 401 });
  }

  try {
    const hashedKey = hashApiKey(rawApiKey);

    // ADD THIS LOG to see the hash your backend generates.
    console.log("Generated hash:", hashedKey);

    const apiKeyRecord = await prisma.extensionApiKey.findUnique({
      where: { hashedKey: hashedKey },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.user) {
      console.log(
        "Authentication failed: No matching hashedKey found in the database."
      );
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const user = apiKeyRecord.user;

    const heartbeats = await request.json();
    console.log(
      `Received ${heartbeats.length} heartbeats for user: ${user.id}`
    );

    prisma.extensionApiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      })
      .catch(console.error);

    return NextResponse.json(
      { message: "Heartbeats received" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error processing heartbeats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
