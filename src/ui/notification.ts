import * as vscode from "vscode";
import type { TokenUsage, TokenStats } from "../types/index.js";

/**
 * 通知管理器
 *
 * 提供生成完成通知和详细统计信息展示。
 */
export class NotificationManager {
  /** 生成完成后显示 Token 消耗通知 */
  showGenerateComplete(usage: TokenUsage): void {
    const message = [
      `提交消息已生成`,
      `Prompt: ${usage.promptTokens}`,
      `Completion: ${usage.completionTokens}`,
      `总计: ${usage.totalTokens} tokens`,
    ].join(" | ");

    vscode.window.showInformationMessage(message);
  }

  /** 显示详细的 Token 统计信息 */
  async showDetailedStats(stats: TokenStats): Promise<void> {
    const lines = [
      `📊 Better Submission Token 统计`,
      ``,
      `--- 当前会话 ---`,
      `请求次数: ${stats.sessionRequests}`,
      `消耗 Token: ${stats.sessionTokens}`,
      ``,
      `--- 历史累计 ---`,
      `总请求次数: ${stats.totalRequests}`,
      `总 Token: ${stats.totalTokens}`,
      `Prompt Token: ${stats.totalPromptTokens}`,
      `Completion Token: ${stats.totalCompletionTokens}`,
    ];

    const action = await vscode.window.showInformationMessage(
      lines.join("\n"),
      { modal: true },
      "重置统计",
    );

    if (action === "重置统计") {
      return; // 调用方处理重置逻辑
    }
  }

  /** 显示错误通知 */
  showError(message: string): void {
    vscode.window.showErrorMessage(`Better Submission: ${message}`);
  }

  /** 显示警告通知 */
  showWarning(message: string): void {
    vscode.window.showWarningMessage(`Better Submission: ${message}`);
  }
}
