import * as vscode from "vscode";
import type { ConfigKey, ExtensionConfig } from "../types/index.js";

/** 配置项默认值 */
const CONFIG_DEFAULTS: ExtensionConfig = {
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o",
  commitFormat: "",
  systemPrompt: "",
  language: "zh-CN",
  maxDiffLength: 8000,
  temperature: 0.3,
};

/** 扩展配置节名称 */
const CONFIG_SECTION = "better-submission";

/**
 * 配置管理器（单例模式）
 *
 * 提供带缓存的类型安全配置读取，监听配置变更自动清空缓存。
 */
export class ConfigurationManager implements vscode.Disposable {
  private static instance: ConfigurationManager | undefined;
  private cache = new Map<string, unknown>();
  private disposable: vscode.Disposable;

  private constructor() {
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_SECTION)) {
        this.cache.clear();
      }
    });
  }

  /** 获取单例实例 */
  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /** 读取指定配置项（带缓存） */
  get<K extends ConfigKey>(key: K): ExtensionConfig[K] {
    if (!this.cache.has(key)) {
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      const value = config.get<ExtensionConfig[K]>(key, CONFIG_DEFAULTS[key]);
      this.cache.set(key, value);
    }
    return this.cache.get(key) as ExtensionConfig[K];
  }

  /** 读取全部配置 */
  getAll(): ExtensionConfig {
    const keys = Object.keys(CONFIG_DEFAULTS) as ConfigKey[];
    const result = {} as Record<string, unknown>;
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result as unknown as ExtensionConfig;
  }

  /** 验证必要配置是否已填写，返回缺失项列表 */
  validateRequired(): string[] {
    const missing: string[] = [];
    if (!this.get("apiKey")) {
      missing.push("API 密钥 (better-submission.apiKey)");
    }
    return missing;
  }

  dispose(): void {
    this.disposable.dispose();
    this.cache.clear();
    ConfigurationManager.instance = undefined;
  }
}
