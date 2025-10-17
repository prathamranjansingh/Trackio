import * as vscode from "vscode";
import debounce from "lodash.debounce";
import { Heartbeat } from "./types";
import { createHeartbeat } from "./Heartbeat";
import * as config from "../utils/config";
import * as cli from "../utils/cli";
import { CacheManager } from "../utils/cache";
import { StatusBarManager } from "../ui/statusBar";
import {
  ACTIVITY_DEBOUNCE_MS,
  BATCH_SEND_INTERVAL_MS,
  EXTENSION_NAME,
} from "../utils/constants";

export class CodeTrackerCore implements vscode.Disposable {
  private context: vscode.ExtensionContext;
  private statusBar: StatusBarManager;
  private cache: CacheManager;
  private cliPath: string | null = null;
  private disposables: vscode.Disposable[] = [];
  private heartbeatQueue: Heartbeat[] = [];
  private sendIntervalId?: NodeJS.Timeout;
  private isDebugging: boolean = false;
  private isInitialized: boolean = false; // Track if API key is set and listeners are active

  // Debounced function for CREATING and queuing a heartbeat
  private debouncedHeartbeatCreator = debounce(
    () => this.createAndQueueHeartbeat(),
    ACTIVITY_DEBOUNCE_MS,
    { leading: false, trailing: true } // Trigger on the trailing edge after pause
  );

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBar = new StatusBarManager();
    this.disposables.push(this.statusBar);
    this.cache = new CacheManager(context);

    this.disposables.push(
      // Listen for config changes to update status bar visibility
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${EXTENSION_NAME}.statusBarVisibility`)) {
          if (config.isStatusBarVisible()) {
            this.statusBar.show(); // Re-show based on current text/state
          } else {
            this.statusBar.hide();
          }
        }
      })
    );
  }

  public async initialize(): Promise<void> {
    this.statusBar.update("$(sync~spin) Code Tracker", "Initializing...");

    // 1. Find and validate CLI
    this.cliPath = cli.getCliPath(this.context);
    if (!this.cliPath) return; // Error already shown by getCliPath

    // 2. Ensure CLI is executable (important for non-Windows)
    if (!cli.ensureCliExecutable(this.cliPath)) return; // Error already shown

    // 3. Check for API Key *before* starting anything else
    const apiKey = config.getApiKey();
    if (!apiKey) {
      console.warn(`${EXTENSION_NAME}: API Key not set.`);
      this.showApiKeyPrompt(); // Display prompt in status bar
      this.isInitialized = false;
      return; // Stop initialization here
    }

    // 4. If API key exists, proceed with full initialization
    await this.completeInitialization();
  }

  // Separated to be called after API key is confirmed/set
  private async completeInitialization(): Promise<void> {
    if (this.isInitialized) return; // Don't re-initialize

    console.log(`${EXTENSION_NAME}: Initializing with API Key.`);
    this.statusBar.update("$(watch) Code Tracker", "Loading cached data...");

    // 5. Load and attempt to send any cached heartbeats from previous session
    await this.sendCachedBatch();

    // 6. Setup listeners for user activity
    this.setupEventListeners();

    // 7. Start the periodic batch sending timer
    this.sendIntervalId = setInterval(
      () => this.sendHeartbeatsFromQueue(),
      BATCH_SEND_INTERVAL_MS
    );

    this.statusBar.update("$(watch) Code Tracker", "Activity tracking active.");
    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    // --- Activity Listeners ---
    const onActivity = () => {
      if (!this.isInitialized) return; // Don't track if not fully initialized
      this.debouncedHeartbeatCreator();
    };
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(onActivity), // Cursor move, selection change
      vscode.workspace.onDidChangeTextDocument(onActivity), // Typing
      vscode.window.onDidChangeActiveTextEditor(onActivity) // Switching files/editors
      // Consider vscode.workspace.onDidSaveTextDocument for 'isWrite' = true?
      // Note: onDidChangeTextDocument might be frequent; debounce handles it.
    );

    // --- Debugging Listeners ---
    this.disposables.push(
      vscode.debug.onDidStartDebugSession(() => {
        this.isDebugging = true;
        // Optionally send an immediate 'debugging started' heartbeat
        // this.createAndQueueHeartbeat(true); // Force immediate creation
        console.log(`${EXTENSION_NAME}: Debug session started.`);
      })
    );
    this.disposables.push(
      vscode.debug.onDidTerminateDebugSession(() => {
        this.isDebugging = false;
        console.log(`${EXTENSION_NAME}: Debug session ended.`);
        // Optionally send an immediate 'debugging stopped' heartbeat
      })
    );
  }

  private createAndQueueHeartbeat(forceImmediate: boolean = false): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document || editor.document.uri.scheme !== "file") {
      // Only track file changes, ignore virtual documents, output panels, etc.
      return;
    }

    // Potential Optimization: Check if the file/activity is significantly different
    // from the last heartbeat to avoid redundant entries. For now, we queue all.

    const isWrite = false; // TODO: Determine if the event was a write (e.g., from onDidSave)
    const heartbeat = createHeartbeat(
      editor.document,
      isWrite,
      this.isDebugging
    );

    console.log("Heartbeat Created:", JSON.stringify(heartbeat, null, 2)); // Pretty-print the JSON

    this.heartbeatQueue.push(heartbeat);
    console.log(`Heartbeat queued. Queue size: ${this.heartbeatQueue.length}`);
    // console.log(`Heartbeat queued: ${path.basename(heartbeat.entity)} (${this.heartbeatQueue.length})`);
  }

  private async sendHeartbeatsFromQueue(
    isShutdown: boolean = false
  ): Promise<void> {
    if (!this.cliPath) {
      console.error(
        `${EXTENSION_NAME}: Cannot send heartbeats, CLI path not found.`
      );
      return; // Should not happen if initialized correctly
    }
    if (this.heartbeatQueue.length === 0) {
      // console.log(`${EXTENSION_NAME}: No heartbeats in queue to send.`);
      return;
    }

    const apiKey = config.getApiKey();
    const apiUrl = config.getApiUrl();

    if (!apiKey) {
      console.error(
        `${EXTENSION_NAME}: Cannot send heartbeats, API Key is missing.`
      );
      // This might happen if the key is removed after initialization.
      this.showApiKeyPrompt();
      this.shutdown(true); // Stop tracking if API key removed
      return;
    }
    if (!apiUrl) {
      console.error(
        `${EXTENSION_NAME}: Cannot send heartbeats, API URL is missing.`
      );
      vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: API URL is not configured. Please check settings.`
      );
      // Don't clear queue, try again later
      return;
    }

    // Create a copy and clear the main queue immediately
    const batchToSend = [...this.heartbeatQueue];
    this.heartbeatQueue = [];
    console.log(
      `${EXTENSION_NAME}: Attempting to send batch of ${batchToSend.length} heartbeats.`
    );
    this.statusBar.update(
      "$(sync~spin) Sending",
      "Sending tracked activity..."
    );
    console.log("Batch Content:", JSON.stringify(batchToSend, null, 2));

    const args = [
      "--key",
      apiKey,
      "--api-url",
      apiUrl,
      "--plugin",
      `vscode/${vscode.version} ${EXTENSION_NAME}/${this.context.extension.packageJSON.version}`,
      // Add other flags your CLI expects
    ];

    try {
      const result = await cli.runCli(
        this.cliPath,
        args,
        JSON.stringify(batchToSend)
      );

      if (result.success) {
        console.log(`${EXTENSION_NAME}: Batch sent successfully.`);
        if (!isShutdown) {
          // Don't reset status bar if VS Code is closing
          this.statusBar.update(
            "$(watch) Code Tracker",
            "Activity tracking active."
          );
        }
      } else {
        console.error(
          `${EXTENSION_NAME}: Failed to send batch: ${result.error}`
        );
        if (!isShutdown) {
          this.statusBar.update(
            "$(error) Code Tracker",
            `Error: ${result.error?.substring(0, 50)}...`
          );
        }

        // Handle specific errors
        if (result.isApiKeyInvalid) {
          vscode.window.showErrorMessage(
            `${EXTENSION_NAME}: Invalid API Key. Please set a valid key.`
          );
          this.showApiKeyPrompt();
          this.shutdown(true); // Stop tracking completely
          // Do NOT re-queue the batch if the key is invalid
        } else {
          // Re-queue the failed batch at the beginning for retry on next interval
          console.log(
            `${EXTENSION_NAME}: Re-queuing ${batchToSend.length} heartbeats.`
          );
          this.heartbeatQueue.unshift(...batchToSend);
        }
      }
    } catch (error) {
      // Catch unexpected errors from runCli promise itself
      console.error(
        `${EXTENSION_NAME}: Unexpected error sending batch:`,
        error
      );
      if (!isShutdown) {
        this.statusBar.update("$(error) Code Tracker", "Unexpected error.");
      }
      // Re-queue on unexpected errors
      console.log(
        `${EXTENSION_NAME}: Re-queuing ${batchToSend.length} heartbeats due to unexpected error.`
      );
      this.heartbeatQueue.unshift(...batchToSend);
    }
  }

  private async sendCachedBatch(): Promise<void> {
    const cachedHeartbeats = await this.cache.loadAndClearCachedBatch();
    if (cachedHeartbeats && cachedHeartbeats.length > 0) {
      // Add cached beats to the *front* of the current queue
      this.heartbeatQueue.unshift(...cachedHeartbeats);
      console.log(
        `${EXTENSION_NAME}: Added ${cachedHeartbeats.length} cached heartbeats to queue.`
      );
      // Attempt to send immediately
      await this.sendHeartbeatsFromQueue();
    }
  }

  // --- Public methods for commands ---

  public async promptForApiKey(): Promise<void> {
    const currentKey = config.getApiKey();
    const newKey = await vscode.window.showInputBox({
      prompt: "Enter your Code Tracker API Key",
      value: currentKey || "",
      password: true,
      ignoreFocusOut: true, // Keep open even if user clicks elsewhere
      placeHolder: "Paste your API key here",
    });

    if (newKey !== undefined && newKey !== currentKey) {
      await config.setApiKey(newKey);
      vscode.window.showInformationMessage("Code Tracker API Key saved.");
      this.statusBar.update(
        "$(check) API Key Saved",
        "Code Tracker is active."
      );

      // If the key was previously missing, start the tracking process
      if (!this.isInitialized && newKey) {
        await this.completeInitialization();
      } else if (this.isInitialized && !newKey) {
        // If the key was removed, stop tracking
        this.shutdown(true);
        this.showApiKeyPrompt();
      } else if (this.isInitialized && newKey) {
        // Key changed while running, maybe just log or confirm it's updated
        console.log(`${EXTENSION_NAME}: API Key updated.`);
      }
    }
  }

  public openDashboardWebsite(): void {
    const url = config.getDashboardUrl();
    vscode.env.openExternal(vscode.Uri.parse(url));
  }

  // --- Utility Methods ---

  private showApiKeyPrompt(): void {
    this.statusBar.update(
      "$(key) Set API Key",
      "Click to set Code Tracker API Key",
      "codetracker.setApiKey"
    );
  }

  /** Shuts down listeners and timers, optionally clearing the queue */
  private shutdown(clearQueue: boolean): void {
    console.log(
      `${EXTENSION_NAME}: Shutting down activity listeners and timers.`
    );
    this.isInitialized = false; // Mark as not ready

    // Stop the interval timer
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = undefined;
    }

    // Cancel any pending debounced action
    this.debouncedHeartbeatCreator.cancel();

    // Remove listeners (alternative to disposing all - more targeted)
    // Consider if managing disposables array is cleaner

    if (clearQueue) {
      console.log(`${EXTENSION_NAME}: Clearing heartbeat queue.`);
      this.heartbeatQueue = [];
      // Also clear any disk cache if shutdown is due to invalid key
      this.cache.clearCache();
    }
  }

  public dispose(): void {
    console.log(`${EXTENSION_NAME}: Disposing extension resources.`);
    this.shutdown(false); // Stop timers/listeners, but DON'T clear queue

    // Ensure any final debounced call gets added to queue
    this.debouncedHeartbeatCreator.flush();

    // Attempt to send one last time (will fail if API key invalid, which is fine)
    // Note: VS Code might close before this finishes, hence the cache
    this.sendHeartbeatsFromQueue(true)
      .then(() => {
        // After attempting to send, save whatever is left (including re-queued items)
        this.cache.saveQueueToDisk(this.heartbeatQueue);
      })
      .catch((err) => {
        // Even if send fails, save the queue
        console.error(
          `${EXTENSION_NAME}: Error during final send, saving queue.`,
          err
        );
        this.cache.saveQueueToDisk(this.heartbeatQueue);
      });

    // Dispose all registered disposables (listeners, status bar)
    this.disposables.forEach((d) => {
      try {
        d.dispose();
      } catch (e) {
        console.error("Error disposing resource:", e);
      }
    });
    this.disposables = [];
  }
}
