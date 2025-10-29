import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as child_process from "child_process";
import {
  EXTENSION_NAME,
  CLI_EXIT_API_ERROR,
  CLI_EXIT_INVALID_API_KEY,
} from "./constants";

export function getCliPath(context: vscode.ExtensionContext): string | null {
  console.log("\n--- getCliPath START ---");
  console.log(
    "[getCliPath] Received context.extensionPath:",
    context.extensionPath
  );

  const platform = os.platform();
  let arch = os.arch();
  console.log(`[getCliPath] os.platform(): ${platform}, os.arch(): ${arch}`);

  if (arch === "x64") arch = "amd64";
  if (arch === "arm64") arch = "arm64";
  console.log(`[getCliPath] Normalized Arch: ${arch}`);

  let binaryName: string;
  switch (platform) {
    case "win32":
      binaryName = `codetracker-cli-${platform}-${arch}.exe`;
      break;
    case "darwin":
    case "linux":
      binaryName = `codetracker-cli-${platform}-${arch}`;
      break;
    default:
      console.error(`[getCliPath] ERROR: Unsupported OS: ${platform}`);
      vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: Unsupported OS: ${platform}`
      );
      console.log("--- getCliPath END (Unsupported OS) ---");
      return null;
  }
  console.log(`[getCliPath] Determined Binary Name: ${binaryName}`);

  const expectedCliPath = path.join(context.extensionPath, "cli", binaryName);
  console.log(`[getCliPath] Constructed Full CLI Path: ${expectedCliPath}`);

  let fileExists = false;
  let checkError: Error | null = null;
  try {
    console.log(
      `[getCliPath] >>> Calling fs.existsSync("${expectedCliPath}") NOW <<<`
    );
    fileExists = fs.existsSync(expectedCliPath);
    console.log(`[getCliPath] <<< fs.existsSync result: ${fileExists} >>>`);
  } catch (err) {
    checkError = err instanceof Error ? err : new Error(String(err));
    console.error(
      `[getCliPath] !!! ERROR during fs.existsSync !!!`,
      checkError
    );
    vscode.window.showErrorMessage(
      `${EXTENSION_NAME}: Error checking for CLI file: ${checkError.message}`
    );
    console.log("--- getCliPath END (existsSync Error) ---");
    return null;
  }

  if (!fileExists) {
    console.error(
      `[getCliPath] !!! FILE NOT FOUND at constructed path: ${expectedCliPath} !!!`
    );
    try {
      const cliDir = path.join(context.extensionPath, "cli");
      if (fs.existsSync(cliDir)) {
        const filesInCliDir = fs.readdirSync(cliDir);
        console.log(`[getCliPath] Contents of ${cliDir}:`, filesInCliDir);
      } else {
        console.log(
          `[getCliPath] Expected cli directory does NOT exist: ${cliDir}`
        );
      }
      const extensionDir = context.extensionPath;
      if (fs.existsSync(extensionDir)) {
        const filesInExtDir = fs.readdirSync(extensionDir);
        console.log(
          `[getCliPath] Contents of ${extensionDir}:`,
          filesInExtDir.filter((f) => !["node_modules"].includes(f))
        );
      } else {
        console.log(
          `[getCliPath] Expected extension directory does NOT exist: ${extensionDir}`
        );
      }
    } catch (listErr) {
      console.error(
        "[getCliPath] Error trying to list directory contents:",
        listErr
      );
    }
    vscode.window.showErrorMessage(
      `${EXTENSION_NAME} CLI not found at ${expectedCliPath}. Please reinstall.`
    );
    console.log("--- getCliPath END (File Not Found) ---");
    return null;
  }

  console.log(`[getCliPath] CLI successfully found at: ${expectedCliPath}`);
  console.log("--- getCliPath END (Success) ---");
  return expectedCliPath;
}

export function ensureCliExecutable(cliPath: string): boolean {
  if (os.platform() !== "win32") {
    try {
      const stats = fs.statSync(cliPath);
      if (!(stats.mode & fs.constants.S_IXUSR)) {
        fs.chmodSync(cliPath, 0o755); // rwxr-xr-x
        console.log(`Made CLI executable: ${cliPath}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: Failed to make CLI executable: ${errorMessage}`
      );
      console.error("chmodSync error:", err);
      return false;
    }
  }
  return true;
}

export interface CliResult {
  success: boolean;
  error?: string;
  isApiKeyInvalid?: boolean;
}

// --- ADD export HERE ---
export function runCli(
  cliPath: string,
  args: string[],
  stdinContent: string
): Promise<CliResult> {
  return new Promise((resolve) => {
    const options: child_process.ExecFileOptions = {
      timeout: 30000,
    };

    const proc = child_process.execFile(
      cliPath,
      args,
      options,
      (error, stdout, stderr) => {
        const stdoutString = stdout?.toString() || "";
        const stderrString = stderr?.toString() || "";
        const combinedOutput = stderrString || stdoutString;

        if (error) {
          if (error.code === CLI_EXIT_INVALID_API_KEY) {
            resolve({
              success: false,
              error:
                combinedOutput ||
                `CLI Error: Invalid API Key (Code ${error.code})`,
              isApiKeyInvalid: true,
            });
          } else if (error.code === CLI_EXIT_API_ERROR) {
            resolve({
              success: false,
              error:
                combinedOutput ||
                `CLI Error: API/Network issue (Code ${error.code})`,
            });
          } else {
            resolve({
              success: false,
              error:
                combinedOutput ||
                `CLI Error: ${error.message} (Code ${error.code})`,
            });
          }
          return;
        }
        if (stderrString) {
          console.warn(`CLI stderr (Exit Code 0): ${stderrString}`);
        }
        resolve({ success: true });
      }
    );

    if (proc.stdin) {
      const stdin = proc.stdin;
      stdin.write(stdinContent, (err) => {
        if (err) {
          console.error("Error writing to CLI stdin:", err);
        }
        try {
          stdin.end();
        } catch (e) {
          console.error("Error ending CLI stdin:", e);
        }
      });
    } else {
      resolve({ success: false, error: "Failed to get CLI stdin stream." });
    }
  });
}
