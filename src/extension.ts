import * as vscode from "vscode";
import { ConfigurationManager } from "./config/configuration.js";
import { GitService } from "./services/git.service.js";
import { LlmService } from "./services/llm.service.js";
import { TokenStatsService } from "./services/token-stats.service.js";
import { StatusBarManager } from "./ui/status-bar.js";
import { NotificationManager } from "./ui/notification.js";
import { createGenerateCommand } from "./commands/generate.js";

/**
 * 扩展激活入口
 *
 * VS Code 在用户首次执行扩展命令或满足激活条件时调用此函数。
 */
export function activate(context: vscode.ExtensionContext): void {
  // 初始化服务
  const config = ConfigurationManager.getInstance();
  const gitService = new GitService();
  const llmService = new LlmService();
  const statsService = new TokenStatsService(context);
  const notification = new NotificationManager();
  const statusBar = new StatusBarManager(statsService);

  // 注册生成提交消息命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "better-submission.generate",
      createGenerateCommand(gitService, llmService, statsService, notification),
    ),
  );

  // 注册查看统计命令
  context.subscriptions.push(
    vscode.commands.registerCommand("better-submission.showStats", async () => {
      await notification.showDetailedStats(statsService.getStats());
    }),
  );

  // 注册重置统计命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "better-submission.resetStats",
      async () => {
        const confirm = await vscode.window.showWarningMessage(
          "确认重置所有 Token 统计数据？",
          { modal: true },
          "确认重置",
        );
        if (confirm === "确认重置") {
          await statsService.reset();
          vscode.window.showInformationMessage("Token 统计已重置");
        }
      },
    ),
  );

  // 注册可释放资源
  context.subscriptions.push(config, statsService, statusBar);
}

/** 扩展停用时调用 */
export function deactivate(): void {
  // 资源通过 subscriptions 自动释放
}
