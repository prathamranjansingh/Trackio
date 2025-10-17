import * as vscode from "vscode";
import { CodeTrackerCore } from "../core/CodeTrackerCore";

// Function to register all commands
export function registerCommands(
  context: vscode.ExtensionContext,
  core: CodeTrackerCore
): void {
  const setApiKeyCommand = vscode.commands.registerCommand(
    "codetracker.setApiKey",
    () => {
      core.promptForApiKey();
    }
  );

  const openDashboardCommand = vscode.commands.registerCommand(
    "codetracker.openDashboard",
    () => {
      core.openDashboardWebsite();
    }
  );

  // Add other commands here using core.publicMethods()

  context.subscriptions.push(setApiKeyCommand, openDashboardCommand);
}
