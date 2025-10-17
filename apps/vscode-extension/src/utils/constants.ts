export const EXTENSION_NAME = "codetracker";
export const CONFIG_SECTION = "codetracker";

// Intervals
export const ACTIVITY_DEBOUNCE_MS = 2 * 1000; // 2 seconds
export const BATCH_SEND_INTERVAL_MS = 2 * 60 * 1000; // 30 minutes

// Cache settings
export const CACHE_KEY = `${EXTENSION_NAME}-cache`;
export const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

// Go CLI exit codes (match your Go code)
export const CLI_EXIT_SUCCESS = 0;
export const CLI_EXIT_API_ERROR = 102;
export const CLI_EXIT_INVALID_API_KEY = 104; // Or appropriate code
