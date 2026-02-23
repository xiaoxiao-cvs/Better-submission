import OpenAI from "openai";
import type {
  ChatMessage,
  GenerateResult,
  TokenUsage,
} from "../types/index.js";
import { ConfigurationManager } from "../config/configuration.js";

/**
 * LLM 服务
 *
 * 使用 OpenAI SDK 发送请求，天然支持自定义 baseURL，
 * 覆盖所有 OpenAI 兼容端点（DeepSeek / 通义千问 / Ollama / vLLM）。
 */
export class LlmService {
  /**
   * 创建 OpenAI 客户端实例
   *
   * 每次调用重新创建，确保配置变更生效。
   */
  private createClient(): OpenAI {
    const config = ConfigurationManager.getInstance();
    return new OpenAI({
      baseURL: config.get("apiUrl"),
      apiKey: config.get("apiKey"),
    });
  }

  /**
   * 生成提交消息
   *
   * @param messages - 聊天消息列表（system + user）
   * @returns 生成结果，包含消息文本和 Token 用量
   */
  async generate(messages: ChatMessage[]): Promise<GenerateResult> {
    const config = ConfigurationManager.getInstance();
    const client = this.createClient();

    try {
      const response = await client.chat.completions.create({
        model: config.get("model"),
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.get("temperature"),
      });

      const content = response.choices[0]?.message?.content ?? "";

      // 清理可能包含的代码块标记
      const cleanedMessage = content
        .replace(/^```[\w]*\n?/gm, "")
        .replace(/\n?```$/gm, "")
        .trim();

      // 解析 Token 用量
      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      };

      return { message: cleanedMessage, usage };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** 将 API 错误转换为友好的中文错误信息 */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          return new Error("API 密钥无效，请检查 better-submission.apiKey 配置");
        case 403:
          return new Error("API 密钥权限不足，无法访问指定模型");
        case 404:
          return new Error(
            `模型不存在或端点错误，请检查 model 和 apiUrl 配置`,
          );
        case 429:
          return new Error("请求频率超限，请稍后重试");
        case 500:
        case 502:
        case 503:
          return new Error("AI 服务暂时不可用，请稍后重试");
        default:
          return new Error(`API 请求失败 (${error.status}): ${error.message}`);
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        return new Error("无法连接到 API 服务，请检查网络和 apiUrl 配置");
      }
      return new Error(`请求失败: ${error.message}`);
    }

    return new Error("未知错误");
  }
}
