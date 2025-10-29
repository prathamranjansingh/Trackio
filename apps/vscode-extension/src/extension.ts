import * as vscode from "vscode";
import { CodeTrackerCore } from "./core/CodeTrackerCore";
import { registerCommands } from "./ui/commands";

// --- ADD THIS UNMISTAKABLE LOG ---
console.log("--- !!! EXTENSION ENTRY POINT (extension.ts) LOADED !!! ---");

let core: CodeTrackerCore | undefined;

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  // --- ADD THIS UNMISTAKABLE LOG ---
  console.log("--- !!! ACTIVATE FUNCTION CALLED !!! ---");

  // Log the version to confirm which code is running
  const extensionVersion = context.extension.packageJSON.version;
  console.log(`--- Activating Code Tracker version: ${extensionVersion} ---`);

  console.log("Code Tracker extension is activating..."); // Original log

  try {
    // Wrap the core instantiation and init
    console.log("--- Instantiating CodeTrackerCore ---");
    core = new CodeTrackerCore(context);
    console.log("--- Calling core.initialize() ---");
    await core.initialize();
    console.log("--- core.initialize() finished ---");
  } catch (coreError) {
    console.error("!!! CRITICAL ERROR DURING CORE SETUP:", coreError);
    vscode.window.showErrorMessage(
      "Code Tracker failed during setup. Check Developer Tools Console."
    );
    return; // Stop if core fails
  }

  // Ensure core was successfully created before registering commands
  if (core) {
    console.log("--- Registering commands ---");
    registerCommands(context, core);
    console.log("--- Pushing core to subscriptions ---");
    context.subscriptions.push(core);
  } else {
    console.error(
      "!!! Core instance is undefined after initialization attempt!"
    );
  }

  console.log("Code Tracker extension activated.");
}

export function deactivate(): Thenable<void> | undefined {
  // --- ADD THIS UNMISTAKABLE LOG ---
  console.log("--- !!! DEACTIVATE FUNCTION CALLED !!! ---");
  // Note: dispose() is called automatically via subscriptions
  // If the core object exists, its dispose will be called.
  return Promise.resolve(); // Standard practice to return a Thenable
}
