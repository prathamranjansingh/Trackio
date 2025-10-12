import * as vscode from "vscode";
import { WakaTime } from "./wakatime";

let wakatime: WakaTime;

export function activate(context: vscode.ExtensionContext) {
  wakatime = new WakaTime(context);
  wakatime.initialize();

  context.subscriptions.push(wakatime);

  // Register all user-facing commands
  context.subscriptions.push(
    vscode.commands.registerCommand("codetracker.setApiKey", () =>
      wakatime.promptForApiKey()
    ),
    vscode.commands.registerCommand("codetracker.openDashboard", () =>
      wakatime.openDashboardWebsite()
    ),
    vscode.commands.registerCommand("codetracker.toggleExtension", () =>
      wakatime.promptToDisable()
    ),
    vscode.commands.registerCommand("codetracker.toggleStatusBar", () =>
      wakatime.promptStatusBarIcon()
    )
  );
}

export function deactivate() {
  wakatime?.dispose();
}
