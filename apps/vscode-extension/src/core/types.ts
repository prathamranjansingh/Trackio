export interface Heartbeat {
  entity: string;
  time: number;
  is_write: boolean;
  project: string;
  language?: string;
  category: "coding" | "debugging";
}

// NEW: This is the wrapper for the entire batch sent to the API
export interface BatchPayload {
  timezone: string;
  heartbeats: Heartbeat[];
}

// For the offline cache
export interface CachedBatch {
  timestamp: number;
  payload: BatchPayload; // The cache will now store the full payload
}
