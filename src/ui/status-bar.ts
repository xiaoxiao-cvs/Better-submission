import * as vscode from "vscode";
import type { TokenStats } from "../types/index.js";
import type { TokenStatsService } from "../services/token-stats.service.js";

/**
 * 状态栏 Token 统计展示
 *
 * 在 VS Code 状态栏左侧显示当前会话的 Token 消耗量，
 * 点击后触发查看详细统计的命令。
 */
export class StatusBarManager implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(statsService: TokenStatsService) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = "better-submission.showStats";
    this.statusBarItem.tooltip = "Better Submission - 点击查看详细 Token 统计";

    // 初始化显示
    this.update(statsService.getStats());

    // 监听统计变更
    this.disposables.push(
      statsService.onDidChange((stats) => this.update(stats)),
    );

    this.statusBarItem.show();
  }

  private update(stats: TokenStats): void {
    this.statusBarItem.text = `$(dashboard) ${stats.sessionTokens} tokens`;
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
