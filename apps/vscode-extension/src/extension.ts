import * as vscode from "vscode";
import { CodeTrackerCore } from "./core/CodeTrackerCore";
import { registerCommands } from "./ui/commands";

let core: CodeTrackerCore | undefined;

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const extensionVersion = context.extension.packageJSON.version;
  console.log(`Activating Code Tracker version: ${extensionVersion}...`); // Essential activation log

  try {
    core = new CodeTrackerCore(context);
    await core.initialize();
  } catch (coreError) {
    console.error("CRITICAL ERROR DURING CODE TRACKER ACTIVATION:", coreError);
    vscode.window.showErrorMessage(
      "Code Tracker failed to activate. Please check Developer Tools Console (Help > Toggle Developer Tools)."
    );
    return; // Stop activation if core fails critically
  }

  if (core) {
    registerCommands(context, core);
    context.subscriptions.push(core); // Ensure dispose is called on deactivation
  } else {
    console.error(
      "Code Tracker core instance is undefined after initialization attempt!"
    );
  }

  console.log("Code Tracker activated successfully."); // Essential activation log
}

export function deactivate(): Thenable<void> | undefined {
  console.log("Deactivating Code Tracker..."); // Keep deactivation log
  // Core dispose will be called automatically via context.subscriptions
  return Promise.resolve();
}
