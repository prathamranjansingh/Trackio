import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import debounce from "lodash.debounce";

// --- Constants and Types ---
const CONFIG_SECTION = "codetracker";
const HEARTBEAT_THROTTLE_MS = 2 * 60 * 1000;
const BATCH_SEND_DEBOUNCE_MS = 15 * 1000;

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
  private lastHeartbeatTime: number = 0;
  private lastHeartbeatFile: string = "";
  private processQueue = debounce(
    () => this._sendHeartbeatsFromQueue(),
    BATCH_SEND_DEBOUNCE_MS
  );

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    const platform = os.platform() === "win32" ? "win32" : os.platform();
    const arch = os.arch() === "amd64" ? "x64" : os.arch();
    const cliName = `codetracker-cli-${platform}-${arch}${platform === "win32" ? ".exe" : ""}`;
    this.cliLocation = path.join(context.extensionPath, "cli", cliName);

    this.statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBar.command = "codetracker.openDashboard";
    this.disposables.push(this.statusBar);
  }

  public async initialize(): Promise<void> {
    this._updateStatusBar("Code Tracker: Initializing...");

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
    ); // Default to localhost for dev
    vscode.env.openExternal(vscode.Uri.parse(url));
  }

  public async promptToDisable(): Promise<void> {
    /* ... (code from previous answers) ... */
  }
  public async promptStatusBarIcon(): Promise<void> {
    /* ... (code from previous answers) ... */
  }

  // --- Event Handling & Heartbeat Logic ---
  private _setupEventListeners(): void {
    const onActivity = () => this._onUserActivity(false);
    const onWrite = () => this._onUserActivity(true);
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(onActivity),
      vscode.workspace.onDidChangeTextDocument(onActivity),
      vscode.window.onDidChangeActiveTextEditor(onActivity),
      vscode.workspace.onDidSaveTextDocument(onWrite)
    );
  }

  private _onUserActivity(isWrite: boolean): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const file = editor.document.uri.fsPath;
    const time = Date.now();

    if (
      !isWrite &&
      file === this.lastHeartbeatFile &&
      time - this.lastHeartbeatTime < HEARTBEAT_THROTTLE_MS
    ) {
      return;
    }
    this.lastHeartbeatFile = file;
    this.lastHeartbeatTime = time;

    const heartbeat = this._createHeartbeat(editor.document, isWrite);
    this.heartbeatQueue.push(heartbeat);
    this.processQueue();
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

  private _runCli(args: string[], stdinContent: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.cliLocation)) {
        return reject(new Error(`CLI not found at: ${this.cliLocation}.`));
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

  // ADD THIS METHOD
  private _updateStatusBar(text: string, tooltip?: string): void {
    if (this._getSetting("statusBarEnabled", true)) {
      this.statusBar.text = text;
      this.statusBar.tooltip = tooltip || "Code Tracker";
      this.statusBar.show();
    }
  }

  public dispose(): void {
    this.processQueue.flush();
    this.disposables.forEach((d) => d.dispose());
  }
}
