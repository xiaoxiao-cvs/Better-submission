import type * as vscode from "vscode";

// ========== 配置相关类型 ==========

/** 支持的提交消息语言 */
export type CommitLanguage = "zh-CN" | "en" | "ja";

/** 扩展配置项 */
export interface ExtensionConfig {
  /** OpenAI 兼容 API 端点地址 */
  apiUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 提交信息格式模板 */
  commitFormat: string;
  /** 自定义系统提示词（覆盖内置） */
  systemPrompt: string;
  /** 提交消息语言 */
  language: CommitLanguage;
  /** Diff 最大字符数 */
  maxDiffLength: number;
  /** 生成温度 */
  temperature: number;
}

/** 配置键名映射 */
export type ConfigKey = keyof ExtensionConfig;

// ========== LLM 相关类型 ==========

/** LLM 消息角色 */
export type MessageRole = "system" | "user" | "assistant";

/** LLM 聊天消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Token 用量信息 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** LLM 生成结果 */
export interface GenerateResult {
  /** 生成的提交消息 */
  message: string;
  /** Token 用量 */
  usage: TokenUsage;
}

// ========== Token 统计相关类型 ==========

/** Token 统计数据 */
export interface TokenStats {
  /** 累计 Token 总量 */
  totalTokens: number;
  /** 累计请求次数 */
  totalRequests: number;
  /** 累计 Prompt Token */
  totalPromptTokens: number;
  /** 累计 Completion Token */
  totalCompletionTokens: number;
  /** 当前会话 Token */
  sessionTokens: number;
  /** 当前会话请求次数 */
  sessionRequests: number;
}

// ========== Git 相关类型 ==========

/** Git 仓库 API 接口（VS Code Git 扩展提供） */
export interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: {
    value: string;
  };
  state: {
    indexChanges: unknown[];
    workingTreeChanges: unknown[];
  };
}

/** Git 扩展 API */
export interface GitExtensionApi {
  getAPI(version: 1): {
    repositories: GitRepository[];
  };
}

/** Diff 获取结果 */
export interface DiffResult {
  /** diff 文本内容 */
  diff: string;
  /** 是否被截断 */
  truncated: boolean;
  /** 错误信息 */
  error?: string;
}

// ========== 命令参数类型 ==========

/** SCM 菜单点击时传入的命令参数 */
export interface ScmCommandArg {
  rootUri?: vscode.Uri;
}
