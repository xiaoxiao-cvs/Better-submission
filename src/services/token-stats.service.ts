import * as vscode from "vscode";
import type { TokenStats, TokenUsage } from "../types/index.js";

/** globalState 存储键 */
const STORAGE_KEY = "better-submission.tokenStats";

/**
 * Token 统计服务
 *
 * 使用 ExtensionContext.globalState 持久化存储累计统计数据。
 * 会话统计（sessionTokens/sessionRequests）仅内存保持，重启后归零。
 */
export class TokenStatsService implements vscode.Disposable {
  private sessionTokens = 0;
  private sessionRequests = 0;
  private context: vscode.ExtensionContext;

  /** 统计数据变更事件 */
  readonly onDidChange: vscode.Event<TokenStats>;
  private readonly changeEmitter = new vscode.EventEmitter<TokenStats>();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.onDidChange = this.changeEmitter.event;
  }

  /** 记录一次 LLM 调用的 Token 消耗 */
  async record(usage: TokenUsage): Promise<void> {
    // 更新会话统计
    this.sessionTokens += usage.totalTokens;
    this.sessionRequests += 1;

    // 更新持久化统计
    const stored = this.getStoredStats();
    stored.totalTokens += usage.totalTokens;
    stored.totalPromptTokens += usage.promptTokens;
    stored.totalCompletionTokens += usage.completionTokens;
    stored.totalRequests += 1;

    await this.context.globalState.update(STORAGE_KEY, stored);

    // 触发变更事件
    this.changeEmitter.fire(this.getStats());
  }

  /** 获取当前完整统计 */
  getStats(): TokenStats {
    const stored = this.getStoredStats();
    return {
      ...stored,
      sessionTokens: this.sessionTokens,
      sessionRequests: this.sessionRequests,
    };
  }

  /** 重置所有统计数据 */
  async reset(): Promise<void> {
    this.sessionTokens = 0;
    this.sessionRequests = 0;
    await this.context.globalState.update(STORAGE_KEY, undefined);
    this.changeEmitter.fire(this.getStats());
  }

  /** 读取持久化存储的统计数据 */
  private getStoredStats(): Omit<TokenStats, "sessionTokens" | "sessionRequests"> {
    return this.context.globalState.get(STORAGE_KEY, {
      totalTokens: 0,
      totalRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    });
  }

  dispose(): void {
    this.changeEmitter.dispose();
  }
}
