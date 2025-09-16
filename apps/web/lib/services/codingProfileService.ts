import { redis } from "@/lib/upstash/redis";
import { ratelimit } from "@/lib/upstash/ratelimit";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { getProvider } from "@/lib/coding-profile";
import { ProviderProfile } from "@/lib/types";

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h by default (tunable)

function cacheKey(provider: string, username: string) {
  return `${provider}:user:${username.toLowerCase()}`;
}

export async function addCodingProfile({
  userId,
  provider,
  username,
}: {
  userId: string;
  provider: string;
  username: string;
}) {
  // use Upstash rate limiter per user (keyed by userId)
  const rl = ratelimit(); // defaults you set in factory
  const keyForRL = `cp:add:${userId}`;
  const rlRes = await rl.limit(keyForRL);
  if (!rlRes.success) {
    return { success: false, status: 429, error: "Rate limit exceeded" };
  }

  // Normalize
  const prov = provider.toLowerCase();
  const uname = username.trim();

  // Basic validation
  if (!prov || !uname) {
    return {
      success: false,
      status: 400,
      error: "provider and username required",
    };
  }

  // Check if the username is already claimed by someone else
  const existing = await prisma.codingProfile.findUnique({
    where: { provider_username: { provider: prov, username: uname } as any },
  });

  if (existing && existing.userId !== userId) {
    return {
      success: false,
      status: 409,
      error: "Username already claimed by another user",
    };
  }

  // Try cache
  const key = cacheKey(prov, uname);
  const cached = await redis.get(key);
  let profile: ProviderProfile | null = null;
  if (cached) {
    try {
      profile = JSON.parse(cached as string);
    } catch {
      profile = null;
    }
  }

  // If not cached, fetch via provider
  if (!profile) {
    const providerImpl = getProvider(prov);
    if (!providerImpl) {
      return { success: false, status: 400, error: "Unsupported provider" };
    }

    try {
      profile = await providerImpl.fetchProfile(uname);
      if (!profile) {
        return {
          success: false,
          status: 404,
          error: "Provider user not found",
        };
      }
      // cache result (stringified)
      await redis.set(key, JSON.stringify(profile), { ex: CACHE_TTL_SECONDS });
    } catch (err: any) {
      console.error("Provider fetch error", err);
      return {
        success: false,
        status: 502,
        error: "Failed to fetch provider profile",
      };
    }
  }

  try {
    const upserted = await prisma.codingProfile.upsert({
      where: { provider_userId: { provider: prov, userId } as any },
      update: {
        username: uname,
        profileJson: profile.profileJson ?? profile,
      },
      create: {
        userId,
        provider: prov,
        username: uname,
        profileJson: profile.profileJson ?? profile,
      },
    });

    return { success: true, status: 200, profile: upserted };
  } catch (err: any) {
    console.error("DB error upserting coding profile", err);
    return { success: false, status: 500, error: "Database error" };
  }
}

export async function listCodingProfiles({ userId }: { userId: string }) {
  const profiles = await prisma.codingProfile.findMany({ where: { userId } });
  return profiles;
}

export async function removeCodingProfile({
  userId,
  provider,
}: {
  userId: string;
  provider: string;
}) {
  const prov = provider.toLowerCase();
  const deleted = await prisma.codingProfile.deleteMany({
    where: { userId, provider: prov },
  });

  return { success: deleted.count > 0, deletedCount: deleted.count };
}
