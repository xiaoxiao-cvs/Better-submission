import * as vscode from "vscode";
import { ConfigurationManager } from "../config/configuration.js";
import { GitService } from "../services/git.service.js";
import { LlmService } from "../services/llm.service.js";
import { TokenStatsService } from "../services/token-stats.service.js";
import { NotificationManager } from "../ui/notification.js";
import { buildMessages } from "../prompts/templates.js";
import type { ScmCommandArg } from "../types/index.js";

/**
 * 生成提交消息命令
 *
 * 完整工作流：
 * 1. 解析仓库 → 2. 检查暂存区 → 3. 获取 diff →
 * 4. 构建提示词 → 5. 调用 LLM → 6. 写入输入框 → 7. 记录统计
 */
export function createGenerateCommand(
  gitService: GitService,
  llmService: LlmService,
  statsService: TokenStatsService,
  notification: NotificationManager,
): (arg?: ScmCommandArg) => Promise<void> {
  return async (arg?: ScmCommandArg) => {
    const config = ConfigurationManager.getInstance();

    // 验证配置
    const missing = config.validateRequired();
    if (missing.length > 0) {
      const action = await vscode.window.showErrorMessage(
        `请先配置: ${missing.join(", ")}`,
        "打开设置",
      );
      if (action === "打开设置") {
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "better-submission",
        );
      }
      return;
    }

    // 获取仓库
    const repo = gitService.getRepository(arg);
    if (!repo) {
      notification.showError("未找到 Git 仓库");
      return;
    }

    const repoPath = repo.rootUri.fsPath;

    // 检查暂存区
    const hasStaged = await gitService.hasStagedChanges(repoPath);
    if (!hasStaged) {
      notification.showWarning("暂存区没有变更，请先使用 git add 暂存文件");
      return;
    }

    // 使用进度通知包裹 LLM 调用
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Better Submission",
        cancellable: true,
      },
      async (
        progress: vscode.Progress<{ message?: string }>,
        token: vscode.CancellationToken,
      ) => {
        progress.report({ message: "正在获取 diff..." });

        // 获取 diff
        const diffResult = await gitService.getStagedDiff(
          repoPath,
          config.get("maxDiffLength"),
        );

        if (diffResult.error) {
          notification.showError(diffResult.error);
          return;
        }

        if (token.isCancellationRequested) {
          return;
        }

        if (diffResult.truncated) {
          progress.report({ message: "Diff 已截断，正在生成提交消息..." });
        } else {
          progress.report({ message: "正在生成提交消息..." });
        }

        // 读取用户已有输入作为额外意图说明
        const existingInput = repo.inputBox.value.trim() || undefined;

        // 构建消息
        const messages = buildMessages(
          diffResult.diff,
          config.get("language"),
          config.get("commitFormat") || undefined,
          config.get("systemPrompt") || undefined,
          existingInput,
        );

        try {
          // 调用 LLM
          const result = await llmService.generate(messages);

          if (token.isCancellationRequested) {
            return;
          }

          // 写入 SCM 输入框
          repo.inputBox.value = result.message;

          // 记录统计
          await statsService.record(result.usage);

          // 显示完成通知
          notification.showGenerateComplete(result.usage);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "生成失败";
          notification.showError(message);
        }
      },
    );
  };
}
