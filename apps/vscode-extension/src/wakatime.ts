import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import debounce from "lodash.debounce";

// --- Constants ---
const CONFIG_SECTION = "codetracker";
const ACTIVITY_DEBOUNCE_MS = 1000; // Create a heartbeat after 1 second of inactivity
const BATCH_SEND_INTERVAL_MS = 2 * 60 * 1000; // Send the collected batch every 2 minutes

interface Heartbeat {
  entity: string;
  time: number;
  is_write: boolean;
  project: string;
  language: string;
}

export class WakaTime implements vscode.Disposable {
  private context: vscode.ExtensionContext;
  private statusBar: vscode.StatusBarItem;
  private cliLocation: string;
  private disposables: vscode.Disposable[] = [];
  private heartbeatQueue: Heartbeat[] = [];
  private sendInterval: NodeJS.Timeout; // Timer for sending the batch

  // The debounced function for CREATING and queuing a heartbeat
  private _debouncedHeartbeatCreator = debounce(
    () => this._createAndQueueHeartbeat(),
    ACTIVITY_DEBOUNCE_MS
  );

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Determine the path to the bundled CLI
    const platform = os.platform() === "win32" ? "win32" : os.platform();
    const arch = os.arch() === "amd64" ? "x64" : os.arch();
    // NEW LINE
    const cliName = `codetracker-cli-${platform}-${arch}${platform === "win32" ? ".exe" : ""}`;
    this.cliLocation = path.join(context.extensionPath, "cli", cliName);

    // Initialize the status bar icon
    this.statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBar.command = "codetracker.openDashboard";
    this.disposables.push(this.statusBar);

    // Set up the recurring timer for SENDING the batch
    this.sendInterval = setInterval(() => {
      this._sendHeartbeatsFromQueue();
    }, BATCH_SEND_INTERVAL_MS);
  }

  public async initialize(): Promise<void> {
    this._updateStatusBar("Code Tracker: Initializing...");

    // Make the CLI executable on macOS/Linux
    if (os.platform() !== "win32" && fs.existsSync(this.cliLocation)) {
      try {
        fs.chmodSync(this.cliLocation, 0o755);
      } catch (e) {
        console.error("Failed to make CLI executable:", e);
        vscode.window.showErrorMessage(
          "Could not make Code Tracker CLI executable."
        );
        return;
      }
    }

    this._setupEventListeners();
    if (this._getSetting("statusBarEnabled", true)) this.statusBar.show();
    this._updateStatusBar("$(watch) Code Tracker", "Code Tracker is active.");
  }

  // --- Public Commands ---
  public async promptForApiKey(): Promise<void> {
    const newKey = await vscode.window.showInputBox({
      prompt: "Enter your Code Tracker API Key",
      value: this._getSetting<string>("apiKey", ""),
      password: true,
      ignoreFocusOut: true,
    });
    if (newKey !== undefined) {
      await this._setSetting("apiKey", newKey);
      this._updateStatusBar(
        "$(check) API Key Saved",
        "Code Tracker is active."
      );
    }
  }

  public openDashboardWebsite(): void {
    const url = this._getSetting<string>(
      "dashboardUrl",
      "http://localhost:3000"
    );
    vscode.env.openExternal(vscode.Uri.parse(url));
  }

  public async promptToDisable(): Promise<void> {
    /* Implement logic here */
  }
  public async promptStatusBarIcon(): Promise<void> {
    /* Implement logic here */
  }

  // --- Event Handling & Heartbeat Logic ---
  private _setupEventListeners(): void {
    // Any user activity will trigger the debounced heartbeat creator
    const onActivity = () => this._debouncedHeartbeatCreator();
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(onActivity),
      vscode.workspace.onDidChangeTextDocument(onActivity),
      vscode.window.onDidChangeActiveTextEditor(onActivity)
    );
  }

  private _createAndQueueHeartbeat(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const heartbeat = this._createHeartbeat(editor.document, false);
    this.heartbeatQueue.push(heartbeat);
    console.log(`Heartbeat queued for: ${path.basename(heartbeat.entity)}`);
  }

  private async _sendHeartbeatsFromQueue(): Promise<void> {
    if (this.heartbeatQueue.length === 0) return;

    const batch = [...this.heartbeatQueue];
    this.heartbeatQueue = [];

    const apiUrl = this._getSetting(
      "apiUrl",
      "http://localhost:3000/api/heartbeats"
    );
    const args = [
      "--plugin",
      `vscode/${vscode.version} codetracker/${this.context.extension.packageJSON.version}`,
      "--key",
      this._getSetting("apiKey", ""),
      "--api-url",
      apiUrl,
    ];

    try {
      await this._runCli(args, JSON.stringify(batch));
      console.log(`Sent batch of ${batch.length} heartbeats.`);
    } catch (error) {
      console.error("Failed to send heartbeats, re-queuing.", error);
      this.heartbeatQueue.unshift(...batch);
    }
  }

  private _createHeartbeat(
    doc: vscode.TextDocument,
    isWrite: boolean
  ): Heartbeat {
    return {
      entity: doc.uri.fsPath,
      time: Date.now() / 1000,
      is_write: isWrite,
      project: vscode.workspace.name ?? "unknown",
      language: doc.languageId,
    };
  }

  private _runCli(args: string[], stdinContent: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.cliLocation)) {
        return reject(
          new Error(
            `CLI not found at: ${this.cliLocation}. Your extension package might be corrupted.`
          )
        );
      }
      const proc = child_process.execFile(
        this.cliLocation,
        args,
        (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || stdout));
          resolve(stdout);
        }
      );
      if (proc.stdin) {
        proc.stdin.write(stdinContent);
        proc.stdin.end();
      }
    });
  }

  // --- Config Helpers & Dispose ---
  private _getSetting<T>(key: string, defaultValue: T): T {
    return vscode.workspace
      .getConfiguration(CONFIG_SECTION)
      .get<T>(key, defaultValue);
  }

  private async _setSetting<T>(key: string, value: T): Promise<void> {
    await vscode.workspace
      .getConfiguration(CONFIG_SECTION)
      .update(key, value, vscode.ConfigurationTarget.Global);
  }

  private _updateStatusBar(text: string, tooltip?: string): void {
    if (this._getSetting("statusBarEnabled", true)) {
      this.statusBar.text = text;
      this.statusBar.tooltip = tooltip || "Code Tracker";
      this.statusBar.show();
    }
  }

  public dispose(): void {
    // Clear the recurring timer
    clearInterval(this.sendInterval);

    // Flush any pending debounced heartbeat to ensure the last action is queued
    this._debouncedHeartbeatCreator.flush();

    // Send any remaining heartbeats in the queue one last time
    this._sendHeartbeatsFromQueue();

    this.disposables.forEach((d) => d.dispose());
  }
}
