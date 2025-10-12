import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API Key is missing" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { apiKey: apiKey }, // In production, this would be a hashed key
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    // 2. Process the heartbeats
    const heartbeats = await request.json();
    console.log(
      `Received ${heartbeats.length} heartbeats for user: ${user.id}`
    );

    // Here, you would add the logic to process and save the heartbeats
    // to your database, linking them to the authenticated user.
    // For now, we just log them.

    return NextResponse.json(
      { message: "Heartbeats received successfully" },
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
