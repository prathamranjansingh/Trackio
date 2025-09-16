import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addCodingProfile,
  listCodingProfiles,
  removeCodingProfile,
} from "@/lib/services/codingProfileService";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const { provider, username } = await req.json();
  const res = await addCodingProfile({
    userId: session.user.id,
    provider,
    username,
  });

  return NextResponse.json(res, { status: res.status ?? 200 });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  console.log("GET coding profiles, session:", session);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const profiles = await listCodingProfiles({ userId: session.user.id });
  return NextResponse.json({ success: true, profiles });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const { provider } = await req.json();
  if (!provider) {
    return NextResponse.json(
      { success: false, error: "provider required" },
      { status: 400 }
    );
  }

  const res = await removeCodingProfile({ userId: session.user.id, provider });
  return NextResponse.json(res, { status: res.success ? 200 : 404 });
}
