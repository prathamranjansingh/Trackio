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
   * This is called when VS Code is closing.
   */
  async savePayloadToDisk(payload: BatchPayload): Promise<void> {
    if (payload.heartbeats.length > 0) {
      console.log(
        `Saving payload with ${payload.heartbeats.length} heartbeats to cache.`
      );
      const cachedData: CachedBatch = {
        timestamp: Date.now(),
        payload: payload, // Store the whole payload
      };
      try {
        await this.context.globalState.update(CACHE_KEY, cachedData);
      } catch (error) {
        console.error("Failed to save heartbeat cache:", error);
      }
    } else {
      // If the queue is empty, ensure the cache is also cleared
      await this.clearCache();
    }
  }

  /**
   * Loads the cached payload from disk, clears the cache, and returns the payload.
   * Returns null if no valid/unexpired cache exists.
   * This is called when the extension starts up.
   */
  async loadAndClearCachedBatchPayload(): Promise<BatchPayload | null> {
    const cachedData = this.context.globalState.get<CachedBatch>(CACHE_KEY);

    if (
      !cachedData ||
      !cachedData.payload ||
      !cachedData.payload.heartbeats ||
      cachedData.payload.heartbeats.length === 0
    ) {
      return null; // No valid cache
    }

    // Check cache age (1-day expiry logic)
    if (Date.now() - cachedData.timestamp > CACHE_MAX_AGE_MS) {
      console.log("Cached batch is older than 24 hours. Discarding.");
      await this.clearCache();
      return null;
    }

    console.log(
      `Loaded payload with ${cachedData.payload.heartbeats.length} heartbeats from cache.`
    );

    // IMPORTANT: Clear the cache immediately before returning
    // to prevent potential double sending if something fails later.
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
