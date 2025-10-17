import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as child_process from "child_process";
import {
  EXTENSION_NAME,
  // CLI_EXIT_SUCCESS is unused, can remove if not needed elsewhere
  CLI_EXIT_API_ERROR,
  CLI_EXIT_INVALID_API_KEY,
} from "./constants";

// --- getCliPath and ensureCliExecutable functions remain the same ---

export function getCliPath(context: vscode.ExtensionContext): string | null {
  const platform = os.platform();
  let arch = os.arch();

  // Normalize arch for binary naming convention
  if (arch === "x64") arch = "amd64";
  if (arch === "arm64") arch = "arm64";

  let binaryName: string;
  switch (platform) {
    case "win32":
      binaryName = `codetracker-cli-${platform}-${arch}.exe`;
      break;
    case "darwin": // macOS
    case "linux":
      binaryName = `codetracker-cli-${platform}-${arch}`;
      break;
    default:
      vscode.window.showErrorMessage(
        `${EXTENSION_NAME}: Unsupported operating system: ${platform}`
      );
      return null;
  }

  const cliPath = path.join(context.extensionPath, "cli", binaryName);

  if (!fs.existsSync(cliPath)) {
    vscode.window.showErrorMessage(
      `${EXTENSION_NAME} CLI not found at ${cliPath}. Please reinstall the extension.`
    );
    console.error(`CLI not found: ${cliPath}`);
    return null;
  }

  return cliPath;
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
      // Safely handle potential errors from fs.statSync or fs.chmodSync
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

// --- CliResult interface remains the same ---
export interface CliResult {
  success: boolean;
  error?: string; // Expecting string | undefined
  isApiKeyInvalid?: boolean;
}

export function runCli(
  cliPath: string,
  args: string[],
  stdinContent: string
): Promise<CliResult> {
  return new Promise((resolve) => {
    const options: child_process.ExecFileOptions = {
      timeout: 30000, // 30 second timeout for the CLI process
    };

    const proc = child_process.execFile(
      cliPath,
      args,
      options,
      (error, stdout, stderr) => {
        // --- FIX IS HERE ---
        // Convert stdout/stderr Buffers to strings
        const stdoutString = stdout?.toString() || "";
        const stderrString = stderr?.toString() || "";
        const combinedOutput = stderrString || stdoutString; // Prioritize stderr for error messages

        if (error) {
          // Now assign the converted strings or default messages
          if (error.code === CLI_EXIT_INVALID_API_KEY) {
            resolve({
              success: false,
              // Use combinedOutput first, then the default message
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
              // Include error.message for more context if output is empty
              error:
                combinedOutput ||
                `CLI Error: ${error.message} (Code ${error.code})`,
            });
          }
          return;
        }
        // Check if Go CLI printed any errors even on success exit code
        if (stderrString) {
          console.warn(`CLI stderr (Exit Code 0): ${stderrString}`);
          // Still resolve as success, but stderr might contain useful warnings
        }
        resolve({ success: true });
      }
    );

    // Write batch data to CLI's standard input
    if (proc.stdin) {
      const stdin = proc.stdin;
      stdin.write(stdinContent, (err) => {
        if (err) {
          console.error("Error writing to CLI stdin:", err);
          // It's tricky to resolve here as the execFile callback might still run.
          // The execFile callback will likely receive an error if stdin fails badly.
        }
        // Use the captured non-null stdin reference to avoid possible null access
        try {
          stdin.end();
        } catch (e) {
          console.error("Error ending CLI stdin:", e);
        }
      });
    } else {
      // This path is less likely but good to handle
      resolve({ success: false, error: "Failed to get CLI stdin stream." });
    }
  });
}
