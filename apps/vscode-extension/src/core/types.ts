// Matches the structure your Go CLI expects via stdin
export interface Heartbeat {
  entity: string; // File path
  time: number; // Unix timestamp (seconds)
  is_write: boolean;
  project: string;
  language?: string; // Optional, matches your schema
  category: "coding" | "debugging";
}

// Structure for the offline cache
export interface CachedBatch {
  timestamp: number; // When the batch was saved (Date.now())
  heartbeats: Heartbeat[];
}
