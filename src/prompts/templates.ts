import type { ChatMessage, CommitLanguage } from "../types/index.js";

/** 语言名称映射 */
const LANGUAGE_NAMES: Record<CommitLanguage, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ja: "日本語",
};

/**
 * 内置默认系统提示词
 *
 * 基于用户截图中的 Conventional Commits 格式模板，
 * 生成结构化的提交消息。
 */
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的 Git 提交消息生成器。根据提供的 git diff 内容，生成规范的提交消息。

## 格式要求

严格遵循以下格式（Conventional Commits）：

\`\`\`
<type>(<scope>): <简短描述>

- <具体变更说明 1>
- <具体变更说明 2>
- <具体变更说明 N>

[可选] BREAKING CHANGE: <破坏性变更说明>
\`\`\`

### type 取值规范
- feat: 新功能
- fix: 修复缺陷
- docs: 文档变更
- style: 代码格式（不影响逻辑）
- refactor: 重构（非新功能、非修复）
- perf: 性能优化
- test: 测试相关
- build: 构建系统或外部依赖
- ci: CI 配置
- chore: 其他杂务

### scope 规范
- 从 diff 中推断受影响的模块/文件/功能域
- 使用简洁的英文小写标识符

### 描述规范
- 简短描述：一句话概括本次提交的核心变更
- 具体变更说明：每条用 "- " 开头，描述一个具体的变更点
- 仅在存在不兼容变更时添加 BREAKING CHANGE 脚注

## 输出要求

- 直接输出提交消息文本，不要包含 \`\`\` 代码块标记
- 不要添加任何额外的解释或前缀
- 确保每条变更说明清晰、具体、有信息量
- 避免笼统的描述（如"优化代码"），必须指出具体变更了什么`;

/**
 * 构建消息列表
 *
 * @param diff - git diff 文本
 * @param language - 目标语言
 * @param commitFormat - 用户自定义格式说明（可选）
 * @param systemPrompt - 完全自定义系统提示词（可选，覆盖一切）
 * @param existingInput - 用户在输入框中已有的文本（作为额外意图说明）
 */
export function buildMessages(
  diff: string,
  language: CommitLanguage,
  commitFormat?: string,
  systemPrompt?: string,
  existingInput?: string,
): ChatMessage[] {
  // 确定系统提示词
  let system: string;

  if (systemPrompt) {
    // 用户完全自定义系统提示词，直接使用
    system = systemPrompt;
  } else if (commitFormat) {
    // 用户提供了格式模板，注入到默认提示词中
    system = `${DEFAULT_SYSTEM_PROMPT}\n\n## 用户自定义格式要求\n\n请额外遵循以下格式规范：\n${commitFormat}`;
  } else {
    system = DEFAULT_SYSTEM_PROMPT;
  }

  // 追加语言要求
  const langName = LANGUAGE_NAMES[language];
  system += `\n\n## 语言要求\n\n提交消息必须使用 ${langName} 编写（type 和 scope 保持英文）。`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  // 构建用户消息
  let userContent = `请根据以下 git diff 生成提交消息：\n\n\`\`\`diff\n${diff}\n\`\`\``;

  if (existingInput) {
    userContent += `\n\n用户补充说明（请参考此意图）：\n${existingInput}`;
  }

  messages.push({ role: "user", content: userContent });

  return messages;
}
