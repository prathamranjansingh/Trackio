import * as vscode from "vscode";
import { CONFIG_SECTION } from "./constants";

export function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIG_SECTION);
}

export function getApiKey(): string {
  return getConfiguration().get<string>("apiKey", "");
}

export async function setApiKey(key: string): Promise<void> {
  await getConfiguration().update(
    "apiKey",
    key,
    vscode.ConfigurationTarget.Global
  );
}

export function getApiUrl(): string {
  // Ensure trailing slash is removed if present, handle potential undefined
  const url = getConfiguration().get<string>("apiUrl");
  if (!url) {
    // Handle case where default isn't set somehow or user clears it
    // Consider logging a warning or throwing an error if this is critical
    console.warn("Code Tracker: API URL is not configured. Using default.");
    return "http://localhost:3000/api/heartbeats"; // Fallback default
  }
  return url.replace(/\/$/, "");
}

export function isStatusBarVisible(): boolean {
  return getConfiguration().get<boolean>("statusBarVisibility", true);
}

export async function setStatusBarVisibility(visible: boolean): Promise<void> {
  await getConfiguration().update(
    "statusBarVisibility",
    visible,
    vscode.ConfigurationTarget.Global
  );
}

// Add functions for other settings as needed (e.g., dashboard URL)
export function getDashboardUrl(): string {
  // Example: If you add a dashboardUrl setting
  // return getConfiguration().get<string>('dashboardUrl', 'http://localhost:3000/dashboard');
  return "http://localhost:3000/dashboard"; // Hardcoded for now
}
