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
  private isSavingCache: boolean = false; // Lock for periodic save

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
    console.log(`${EXTENSION_NAME}: Initializing with API Key.`);
    this.isInitialized = true; // Mark initialized earlier

    this.statusBar.update("$(watch) Code Tracker", "Loading cached data...");

    try {
      console.log(">>> [Init] About to call sendCachedBatch <<<");
      await this.sendCachedBatch();
      console.log(">>> [Init] Finished calling sendCachedBatch <<<");
    } catch (cacheError) {
      console.error(
        "!!! [Init] CRITICAL ERROR during sendCachedBatch:",
        cacheError
      );
    }

    console.log(">>> [Init] About to call setupEventListeners <<<");
    this.setupEventListeners();
    console.log(">>> [Init] Finished calling setupEventListeners <<<");

    console.log(">>> [Init] About to set interval timer <<<");
    this.sendIntervalId = setInterval(
      () => this.sendHeartbeatsFromQueue(),
      BATCH_SEND_INTERVAL_MS
    );
    console.log(">>> [Init] Finished setting interval timer <<<");

    this.statusBar.update("$(watch) Code Tracker", "Activity tracking active.");
    console.log(">>> [Init] completeInitialization FINISHED <<<");
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
    console.log("Heartbeat Created:", JSON.stringify(heartbeat, null, 2));
    this.heartbeatQueue.push(heartbeat);
    console.log(`Queue size is now: ${this.heartbeatQueue.length}`);

    // --- Trigger save ---
    console.log(">>> ABOUT TO CALL saveQueuePeriodically <<<");
    try {
      this.saveQueuePeriodically();
    } catch (e) {
      console.error("!!! SYNC ERROR CALLING saveQueuePeriodically:", e);
    }
  }

  private saveQueuePeriodically(): void {
    console.log(">>> saveQueuePeriodically FUNCTION ENTERED <<<");
    if (this.isSavingCache) {
      console.log("[Cache] Save already in progress, skipping periodic save.");
      return;
    }
    if (this.heartbeatQueue.length === 0) {
      console.log("[Cache] Queue empty, ensuring cache is cleared (periodic)");
      this.cache
        .clearCache()
        .catch((e) =>
          console.error("[Cache] Error clearing cache periodically:", e)
        );
      return;
    }

    this.isSavingCache = true;
    console.log("[Cache] Preparing payload for periodic save...");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payloadToSave: BatchPayload = {
      timezone: timezone,
      heartbeats: [...this.heartbeatQueue],
    };

    console.log(
      "[Cache] >>> Calling cache.savePayloadToDisk NOW (periodic) <<<"
    );
    this.cache
      .savePayloadToDisk(payloadToSave)
      .then(() => {
        console.log("[Cache] <<< Periodic save promise RESOLVED >>>");
      })
      .catch((err) => {
        console.error("[Cache] <<< Periodic save promise REJECTED: >>>", err);
      })
      .finally(() => {
        console.log("[Cache] Releasing save lock.");
        this.isSavingCache = false;
      });
    console.log("[Cache] Periodic save initiated (async).");
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
    console.log(">>> sendCachedBatch START <<<");
    let cachedPayload: BatchPayload | null = null;
    try {
      console.log(
        "[sendCachedBatch] >>> Calling cache.loadAndClearCachedBatchPayload NOW <<<"
      );
      cachedPayload = await this.cache.loadAndClearCachedBatchPayload();
      if (cachedPayload?.heartbeats?.length) {
        console.log(
          `[sendCachedBatch] Found ${cachedPayload.heartbeats.length} heartbeats in cache. Adding to queue.`
        );
        this.heartbeatQueue.unshift(...cachedPayload.heartbeats);
        console.log(`[sendCachedBatch] >>> About to send cached batch NOW <<<`);
        await this.sendHeartbeatsFromQueue();
        console.log(`[sendCachedBatch] <<< Finished sending cached batch >>>`);
      } else {
        console.log(
          `[sendCachedBatch] No valid cached payload was returned by CacheManager.`
        );
      }
    } catch (loadError) {
      console.error(
        "!!! [sendCachedBatch] CRITICAL ERROR during cache load/send:",
        loadError
      );
    }
    console.log(">>> sendCachedBatch END <<<");
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
    console.log("--- !!! CodeTrackerCore dispose() ENTERED !!! ---");
    this.shutdown(false);
    this.debouncedHeartbeatCreator.flush();
    console.log(
      `[Dispose] Heartbeat queue size before saving: ${this.heartbeatQueue.length}`
    );
    if (this.heartbeatQueue.length > 0 && !this.isSavingCache) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const finalPayload: BatchPayload = {
        timezone: timezone,
        heartbeats: [...this.heartbeatQueue],
      };
      console.log(
        `[Dispose] >>> Calling cache.savePayloadToDisk NOW (final attempt) <<<`
      );
      this.cache
        .savePayloadToDisk(finalPayload)
        .then(() =>
          console.log(
            `[Dispose] <<< Final save promise RESOLVED (might be late) <<<`
          )
        )
        .catch((err) =>
          console.error(`[Dispose] <<< Final save promise REJECTED:`, err)
        );
      console.log(`[Dispose] Final save initiated (async).`);
    } else if (this.isSavingCache) {
      console.log(
        `[Dispose] Skipping final save as periodic save might be in progress.`
      );
    } else {
      console.log(`[Dispose] Queue empty, calling clearCache...`);
      this.cache
        .clearCache()
        .catch((e) => console.error("[Dispose] Error clearing cache:", e));
    }
    this.disposables.forEach((d) => {
      try {
        d.dispose();
      } catch (e) {
        console.error("Error disposing resource:", e);
      }
    });
    console.log(">>> Dispose END (Synchronous part finished) <<<");
  }

  public async forceSendBatch(): Promise<void> {
    if (!this.isInitialized) {
      vscode.window.showWarningMessage("Code Tracker is not initialized.");
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
