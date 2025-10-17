import * as vscode from "vscode";
import { CACHE_KEY, CACHE_MAX_AGE_MS } from "./constants";
import { CachedBatch, Heartbeat } from "../core/types";

export class CacheManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async saveQueueToDisk(queue: Heartbeat[]): Promise<void> {
    if (queue.length > 0) {
      console.log(`Saving ${queue.length} heartbeats to cache.`);
      const cachedBatch: CachedBatch = {
        timestamp: Date.now(),
        heartbeats: queue,
      };
      try {
        // Use Memento API for reliable storage
        await this.context.globalState.update(CACHE_KEY, cachedBatch);
      } catch (error) {
        console.error("Failed to save heartbeat cache:", error);
        // Optionally show an error message to the user
        // vscode.window.showErrorMessage("Failed to save unsent coding data.");
      }
    } else {
      // If the queue is empty, ensure the cache is also cleared
      await this.clearCache();
    }
  }

  /**
   * Loads the cached batch from disk, clears it, and returns the heartbeats.
   * Returns null if no valid cache exists.
   */
  async loadAndClearCachedBatch(): Promise<Heartbeat[] | null> {
    const cachedData = this.context.globalState.get<CachedBatch>(CACHE_KEY);

    if (
      !cachedData ||
      !cachedData.heartbeats ||
      cachedData.heartbeats.length === 0
    ) {
      return null; // No valid cache
    }

    // Check cache age (your 1-day expiry logic)
    if (Date.now() - cachedData.timestamp > CACHE_MAX_AGE_MS) {
      console.log("Cached batch is older than 24 hours. Discarding.");
      await this.clearCache();
      return null;
    }

    console.log(
      `Loaded ${cachedData.heartbeats.length} heartbeats from cache.`
    );

    // IMPORTANT: Clear the cache immediately *before* returning
    // to prevent potential double sending if something fails later.
    await this.clearCache();

    return cachedData.heartbeats;
  }

  async clearCache(): Promise<void> {
    try {
      await this.context.globalState.update(CACHE_KEY, undefined);
    } catch (error) {
      console.error("Failed to clear heartbeat cache:", error);
    }
  }
}
