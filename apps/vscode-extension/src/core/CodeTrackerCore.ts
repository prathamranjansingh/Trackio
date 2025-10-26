import * as vscode from "vscode";
import debounce from "lodash.debounce";
import { Heartbeat, BatchPayload } from "./types";
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
  private isInitialized: boolean = false;

  private debouncedHeartbeatCreator = debounce(
    () => this.createAndQueueHeartbeat(),
    ACTIVITY_DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBar = new StatusBarManager();
    this.disposables.push(this.statusBar);
    this.cache = new CacheManager(context);
  }

  public async initialize(): Promise<void> {
    this.statusBar.update("$(sync~spin) Code Tracker", "Initializing...");

    this.cliPath = cli.getCliPath(this.context);
    if (!this.cliPath || !cli.ensureCliExecutable(this.cliPath)) {
      this.statusBar.update(
        "$(error) CLI Error",
        "CLI setup failed. Please reinstall."
      );
      return;
    }

    if (!config.getApiKey()) {
      console.warn(`${EXTENSION_NAME}: API Key not set.`);
      this.showApiKeyPrompt();
      this.isInitialized = false;
      return;
    }

    await this.completeInitialization();
  }

  private async completeInitialization(): Promise<void> {
    if (this.isInitialized) return;
    console.log(`${EXTENSION_NAME}: Initializing with API Key.`); // You see this

    // --- Add try/catch around cache loading ---
    try {
      console.log(">>> [Init] About to call sendCachedBatch <<<"); // ADDED
      await this.sendCachedBatch();
      console.log(">>> [Init] Finished calling sendCachedBatch <<<"); // ADDED
    } catch (cacheError) {
      console.error(
        "!!! [Init] CRITICAL ERROR during sendCachedBatch:",
        cacheError
      ); // ADDED
      // Decide if you want to continue initialization or stop if cache fails
    }
    // --- End try/catch ---

    console.log(">>> [Init] About to call setupEventListeners <<<"); // ADDED
    this.setupEventListeners();
    console.log(">>> [Init] Finished calling setupEventListeners <<<"); // ADDED

    console.log(">>> [Init] About to set interval timer <<<"); // ADDED
    this.sendIntervalId = setInterval(
      () => this.sendHeartbeatsFromQueue(),
      BATCH_SEND_INTERVAL_MS
    );
    console.log(">>> [Init] Finished setting interval timer <<<"); // ADDED

    this.statusBar.update("$(watch) Code Tracker", "Activity tracking active.");
    this.isInitialized = true; // Mark initialized at the very end
    console.log(">>> [Init] completeInitialization FINISHED <<<"); // ADDED
  }

  private setupEventListeners(): void {
    const onActivity = () => {
      if (this.isInitialized) this.debouncedHeartbeatCreator();
    };
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(onActivity),
      vscode.workspace.onDidChangeTextDocument(onActivity),
      vscode.window.onDidChangeActiveTextEditor(onActivity),
      vscode.debug.onDidStartDebugSession(() => {
        this.isDebugging = true;
      }),
      vscode.debug.onDidTerminateDebugSession(() => {
        this.isDebugging = false;
      })
    );
  }

  private createAndQueueHeartbeat(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      return;
    }
    const heartbeat = createHeartbeat(editor.document, false, this.isDebugging);

    // --- LOGGING ADDED HERE ---
    console.log("Heartbeat Created:", JSON.stringify(heartbeat, null, 2));

    this.heartbeatQueue.push(heartbeat);
    console.log(`Queue size is now: ${this.heartbeatQueue.length}`);
  }

  private async sendHeartbeatsFromQueue(
    isShutdown: boolean = false
  ): Promise<void> {
    if (!this.cliPath || this.heartbeatQueue.length === 0) {
      return;
    }

    const apiKey = config.getApiKey();
    const apiUrl = config.getApiUrl();
    if (!apiKey) {
      this.shutdown(true);
      this.showApiKeyPrompt();
      return;
    }

    const batchToSend = [...this.heartbeatQueue];
    this.heartbeatQueue = [];

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload: BatchPayload = {
      timezone: timezone,
      heartbeats: batchToSend,
    };
    const payloadString = JSON.stringify(payload);

    console.log(
      `${EXTENSION_NAME}: Sending batch of ${batchToSend.length} from ${timezone}.`
    );

    // --- LOGGING ADDED HERE ---
    console.log("--- Batch Content Being Sent ---");
    console.log(JSON.stringify(payload, null, 2));
    console.log("---------------------------------");

    if (!isShutdown)
      this.statusBar.update("$(sync~spin) Sending...", "Sending activity...");

    const args = [
      "--key",
      apiKey,
      "--api-url",
      apiUrl,
      "--plugin",
      `vscode/${vscode.version} ${EXTENSION_NAME}/${this.context.extension.packageJSON.version}`,
    ];

    try {
      const result = await cli.runCli(this.cliPath, args, payloadString);
      if (result.success) {
        console.log(`${EXTENSION_NAME}: Batch sent successfully.`);
        if (!isShutdown)
          this.statusBar.update(
            "$(watch) Code Tracker",
            "Activity tracking active."
          );
      } else {
        console.error(
          `${EXTENSION_NAME}: Failed to send batch: ${result.error}`
        );
        if (!isShutdown)
          this.statusBar.update(
            "$(error) Send Failed",
            `Error: ${result.error?.substring(0, 50)}...`
          );

        if (result.isApiKeyInvalid) {
          vscode.window.showErrorMessage(
            `${EXTENSION_NAME}: Invalid API Key. Tracking stopped.`
          );
          this.shutdown(true);
          this.showApiKeyPrompt();
        } else {
          console.log(
            `${EXTENSION_NAME}: Re-queuing ${batchToSend.length} heartbeats.`
          );
          this.heartbeatQueue.unshift(...batchToSend);
        }
      }
    } catch (error) {
      console.error(
        `${EXTENSION_NAME}: Unexpected error sending batch:`,
        error
      );
      if (!isShutdown)
        this.statusBar.update("$(error) Send Error", "Unexpected error.");
      this.heartbeatQueue.unshift(...batchToSend);
    }
  }

  private async sendCachedBatch(): Promise<void> {
    console.log(">>> [sendCachedBatch] Function ENTERED <<<"); // ADDED
    try {
      // Add try/catch here too
      const cachedPayload = await this.cache.loadAndClearCachedBatchPayload();
      if (cachedPayload?.heartbeats?.length) {
        console.log(
          `[sendCachedBatch] Found ${cachedPayload.heartbeats.length} heartbeats. Adding to queue.`
        );
        this.heartbeatQueue.unshift(...cachedPayload.heartbeats);
        console.log(`[sendCachedBatch] >>> About to send cached batch NOW <<<`); // ADDED
        await this.sendHeartbeatsFromQueue();
        console.log(`[sendCachedBatch] <<< Finished sending cached batch >>>`); // ADDED
      } else {
        console.log(`[sendCachedBatch] No cached payload found.`);
      }
    } catch (loadError) {
      console.error(
        "!!! [sendCachedBatch] CRITICAL ERROR loading/sending cache:",
        loadError
      ); // ADDED
    }
    console.log(">>> [sendCachedBatch] Function EXITED <<<"); // ADDED
  }

  public async promptForApiKey(): Promise<void> {
    const newKey = await vscode.window.showInputBox({
      prompt: "Enter your Code Tracker API Key",
      password: true,
      ignoreFocusOut: true,
    });

    if (newKey !== undefined) {
      await config.setApiKey(newKey);
      if (newKey) {
        vscode.window.showInformationMessage("Code Tracker API Key saved.");
        if (!this.isInitialized) await this.completeInitialization();
      } else {
        vscode.window.showWarningMessage("API Key removed. Tracking stopped.");
        this.shutdown(true);
        this.showApiKeyPrompt();
      }
    }
  }

  public openDashboardWebsite(): void {
    vscode.env.openExternal(vscode.Uri.parse(config.getDashboardUrl()));
  }

  private showApiKeyPrompt(): void {
    this.statusBar.update(
      "$(key) Set API Key",
      "Click to set Code Tracker API Key",
      "codetracker.setApiKey"
    );
  }

  private shutdown(clear: boolean): void {
    this.isInitialized = false;
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = undefined;
    }
    this.debouncedHeartbeatCreator.cancel();
    if (clear) {
      this.heartbeatQueue = [];
      this.cache.clearCache();
    }
  }

  public dispose(): void {
    console.log(`${EXTENSION_NAME}: Disposing resources.`);
    this.shutdown(false);
    this.debouncedHeartbeatCreator.flush();

    console.log(
      `[Dispose] Heartbeat queue size before saving: ${this.heartbeatQueue.length}`
    );
    if (this.heartbeatQueue.length > 0) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const finalPayload: BatchPayload = {
        timezone: timezone,
        heartbeats: this.heartbeatQueue,
      };
      this.cache.savePayloadToDisk(finalPayload);
    } else {
      console.log(`[Dispose] Heartbeat queue was empty. Clearing cache.`); // ADDED
      this.cache.clearCache();
    }

    this.disposables.forEach((d) => d.dispose());
  }

  public async forceSendBatch(): Promise<void> {
    if (!this.isInitialized) {
      vscode.window.showWarningMessage(
        "Code Tracker is not initialized (API key might be missing)."
      );
      return;
    }
    console.log("Force sending batch via command...");
    if (this.sendIntervalId) clearInterval(this.sendIntervalId);
    await this.sendHeartbeatsFromQueue();
    if (this.isInitialized) {
      this.sendIntervalId = setInterval(
        () => this.sendHeartbeatsFromQueue(),
        BATCH_SEND_INTERVAL_MS
      );
    }
  }
}
