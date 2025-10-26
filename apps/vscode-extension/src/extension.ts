import * as vscode from "vscode";
import { CodeTrackerCore } from "./core/CodeTrackerCore";
import { registerCommands } from "./ui/commands";

let core: CodeTrackerCore | undefined;

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("Code Tracker extension is activating...");

  core = new CodeTrackerCore(context);
  await core.initialize(); // Initialize checks API key, CLI, etc.

  // Register all user-facing commands
  registerCommands(context, core);

  context.subscriptions.push(core); // Add core to subscriptions so dispose is called

  console.log("Code Tracker extension activated.");
}

export function deactivate(): void {
  console.log("Code Tracker extension deactivating...");
  // Dispose will be called automatically by VS Code on the 'core' instance
  // because we added it to context.subscriptions
  console.log("Code Tracker extension deactivated.");
}
