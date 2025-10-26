import * as vscode from "vscode";
import { CACHE_KEY, CACHE_MAX_AGE_MS } from "./constants";
import { BatchPayload, CachedBatch } from "../core/types";

export class CacheManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Saves the entire BatchPayload object (heartbeats + timezone) to disk.
   */
  async savePayloadToDisk(payload: BatchPayload): Promise<void> {
    if (payload.heartbeats.length > 0) {
      console.log(
        `Saving payload with ${payload.heartbeats.length} heartbeats to cache.`
      );
      const cachedData: CachedBatch = {
        timestamp: Date.now(),
        payload: payload,
      };
      try {
        await this.context.globalState.update(CACHE_KEY, cachedData);
      } catch (error) {
        console.error("Failed to save heartbeat cache:", error);
      }
    } else {
      await this.clearCache();
    }
  }

  /**
   * Loads the cached payload from disk, clears the cache, and returns the payload.
   */
  async loadAndClearCachedBatchPayload(): Promise<BatchPayload | null> {
    const cachedData = this.context.globalState.get<CachedBatch>(CACHE_KEY);

    if (
      !cachedData ||
      !cachedData.payload ||
      !cachedData.payload.heartbeats ||
      cachedData.payload.heartbeats.length === 0
    ) {
      return null;
    }

    if (Date.now() - cachedData.timestamp > CACHE_MAX_AGE_MS) {
      console.log("Cached batch is older than 24 hours. Discarding.");
      await this.clearCache();
      return null;
    }

    console.log(
      `Loaded payload with ${cachedData.payload.heartbeats.length} heartbeats from cache.`
    );

    await this.clearCache();
    return cachedData.payload;
  }

  async clearCache(): Promise<void> {
    try {
      await this.context.globalState.update(CACHE_KEY, undefined);
    } catch (error) {
      console.error("Failed to clear heartbeat cache:", error);
    }
  }
}
