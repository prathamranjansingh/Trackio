import * as vscode from "vscode";
import { isStatusBarVisible } from "../utils/config";

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private isVisible: boolean = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left, // Position
      100 // Priority (lower numbers are further left)
    );
    this.isVisible = isStatusBarVisible(); // Initial state from config
    if (this.isVisible) {
      this.statusBarItem.show();
    }
  }

  update(text: string, tooltip?: string, command?: string): void {
    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = tooltip || "Code Tracker";
    this.statusBarItem.command = command; // Command to run on click

    if (this.isVisible) {
      this.statusBarItem.show();
    }
  }

  show(): void {
    if (isStatusBarVisible()) {
      this.isVisible = true;
      this.statusBarItem.show();
    }
  }

  hide(): void {
    this.isVisible = false;
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
