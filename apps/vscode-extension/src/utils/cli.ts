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
  const platform = os.platform();
  let arch = os.arch();

  if (arch === "x64") arch = "amd64";
  if (arch === "arm64") arch = "arm64";

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
      return null;
  }

  const expectedCliPath = path.join(context.extensionPath, "cli", binaryName);

  try {
    if (!fs.existsSync(expectedCliPath)) {
      console.error(
        `[getCliPath] !!! FILE NOT FOUND at path: ${expectedCliPath} !!!`
      );
      vscode.window.showErrorMessage(
        `${EXTENSION_NAME} CLI not found at ${expectedCliPath}. Please reinstall.`
      );
      return null;
    }
  } catch (err) {
    const checkError = err instanceof Error ? err : new Error(String(err));
    console.error(
      `[getCliPath] !!! ERROR during fs.existsSync !!!`,
      checkError
    );
    vscode.window.showErrorMessage(
      `${EXTENSION_NAME}: Error checking for CLI file: ${checkError.message}`
    );
    return null;
  }

  return expectedCliPath;
}

export function ensureCliExecutable(cliPath: string): boolean {
  if (os.platform() !== "win32") {
    try {
      const stats = fs.statSync(cliPath);
      // eslint-disable-next-line no-bitwise
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
          // Log the actual error output from CLI for debugging backend issues
          console.error(`[runCli] CLI Error Output: ${combinedOutput}`);
          console.error(`[runCli] CLI Exit Code: ${error.code}`);

          if (error.code === CLI_EXIT_INVALID_API_KEY) {
            resolve({
              success: false,
              error: combinedOutput || `CLI Error: Invalid API Key`,
              isApiKeyInvalid: true,
            });
          } else if (error.code === CLI_EXIT_API_ERROR) {
            resolve({
              success: false,
              error: combinedOutput || `CLI Error: API/Network issue`,
            });
          } else {
            resolve({
              success: false,
              error: combinedOutput || `CLI Error: ${error.message}`,
            });
          }
          return;
        }
        // Log warnings from stderr even on success
        if (stderrString) {
          console.warn(`[runCli] CLI stderr (Exit Code 0): ${stderrString}`);
        }
        resolve({ success: true });
      }
    );

    if (proc.stdin) {
      const stdin = proc.stdin;
      stdin.write(stdinContent, (err) => {
        if (err) {
          console.error("[runCli] Error writing to CLI stdin:", err);
        }
        try {
          stdin.end();
        } catch (e) {
          console.error("[runCli] Error ending CLI stdin:", e);
        }
      });
    } else {
      console.error("[runCli] Failed to get CLI stdin stream.");
      resolve({ success: false, error: "Failed to get CLI stdin stream." });
    }
  });
}
