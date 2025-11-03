import * as vscode from "vscode";
import { CACHE_KEY, CACHE_MAX_AGE_MS } from "./constants";
import { BatchPayload, CachedBatch } from "../core/types";

export class CacheManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async savePayloadToDisk(payload: BatchPayload): Promise<void> {
    if (payload.heartbeats.length > 0) {
      const cachedData: CachedBatch = {
        timestamp: Date.now(),
        payload: payload,
      };
      try {
        await this.context.globalState.update(CACHE_KEY, cachedData);
        // console.log(`[CacheManager] Saved ${payload.heartbeats.length} heartbeats.`); // Optional: Keep for debugging if needed
      } catch (error) {
        console.error(
          "[CacheManager] CRITICAL: Failed to save heartbeat cache:",
          error
        );
        // Maybe show error only once to avoid spamming user
        // vscode.window.showErrorMessage("Code Tracker: Failed to save unsent data!");
      }
    } else {
      await this.clearCache(); // Ensure cache is clear if queue is empty
    }
  }

  async loadAndClearCachedBatchPayload(): Promise<BatchPayload | null> {
    let cachedData: CachedBatch | undefined;
    try {
      cachedData = this.context.globalState.get<CachedBatch>(CACHE_KEY);
    } catch (e) {
      console.error("[CacheManager] Error getting data from globalState:", e);
      await this.clearCache(); // Clear potentially corrupt data
      return null;
    }

    if (!cachedData?.payload?.heartbeats?.length) {
      return null; // No valid cache
    }

    if (Date.now() - cachedData.timestamp > CACHE_MAX_AGE_MS) {
      console.log("[CacheManager] Cache expired. Discarding.");
      await this.clearCache();
      return null;
    }

    console.log(
      `[CacheManager] Valid cache found (${cachedData.payload.heartbeats.length} heartbeats). Clearing cache.`
    );
    try {
      await this.clearCache(); // Clear cache AFTER validation
    } catch (clearError) {
      console.error(
        "[CacheManager] Error clearing cache after load:",
        clearError
      );
      // Non-fatal, return the data anyway
    }
    return cachedData.payload;
  }

  async clearCache(): Promise<void> {
    try {
      await this.context.globalState.update(CACHE_KEY, undefined);
    } catch (error) {
      console.error("[CacheManager] Failed to clear heartbeat cache:", error);
    }
  }
}
