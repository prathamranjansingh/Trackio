import * as vscode from "vscode";
import { Heartbeat } from "./types";

export function createHeartbeat(
  document: vscode.TextDocument,
  isWrite: boolean,
  isDebugging: boolean
): Heartbeat {
  const timestamp = Date.now() / 1000; // Convert ms to seconds

  // Try to determine project name (workspace folder is a good approximation)
  let projectName = "unknown";
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (workspaceFolder) {
    projectName = workspaceFolder.name;
  } else {
    // Fallback if not in a workspace (e.g., single file open)
    // You might try other heuristics or leave as unknown
  }

  return {
    entity: document.uri.fsPath, // Use fsPath for the local file path
    time: timestamp,
    is_write: isWrite,
    project: projectName,
    language: document.languageId, // Use VS Code's language ID
    category: isDebugging ? "debugging" : "coding",
  };
}
