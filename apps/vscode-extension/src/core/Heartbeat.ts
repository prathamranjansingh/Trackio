import * as vscode from "vscode";
import { Heartbeat } from "./types";

export function createHeartbeat(
  document: vscode.TextDocument,
  isWrite: boolean,
  isDebugging: boolean
): Heartbeat {
  const timestamp = Date.now() / 1000;

  let projectName = "unknown";
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (workspaceFolder) {
    projectName = workspaceFolder.name;
  } else {
  }

  return {
    entity: document.uri.fsPath,
    time: timestamp,
    is_write: isWrite,
    project: projectName,
    language: document.languageId,
    category: isDebugging ? "debugging" : "coding",
  };
}
