import { redis } from "./redis";



export const cacheData = async (key: string, data: any, ttlSeconds: number): Promise<void> => {
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    console.error(error);
  }
};


export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    // FIX: The `get` method from @upstash/redis will automatically parse the JSON.
    // `data` will be an object of type T, not a string.
    const data = await redis.get<T>(key);

    if (!data) {
      console.log(`[CACHE MISS] ${key}`);
      return null;
    }

    console.log(`[CACHE HIT] ${key}`);
    // FIX: Removed manual JSON.parse. This was the source of the crash.
    return data;
  } catch (error) {
    console.error(`[CACHE GET ERROR] Failed to retrieve or parse cache for key "${key}":`, error);
    return null;
  }
};

export const invalidateCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(error);
  }
};


export const invalidateCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      if (keys.length) {
        keysToDelete.push(...keys);
      }
      cursor = Number(nextCursor);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    console.error(error);
  }
};