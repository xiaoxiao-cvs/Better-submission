# Better Submission

简洁快速与高度自定义的 AI 提交信息生成 — VS Code 扩展。

## 功能

- **一键生成**：在源代码管理标题栏点击 ✨ 按钮，自动分析暂存区 diff 并生成规范的提交消息
- **自定义端点**：支持任意 OpenAI 兼容 API（OpenAI / DeepSeek / 通义千问 / Ollama / vLLM 等）
- **格式模板**：内置 Conventional Commits 格式，支持用户完全自定义格式规范
- **Token 统计**：状态栏实时显示会话消耗，每次生成后通知弹窗显示详细用量
- **多语言**：提交消息支持简体中文 / English / 日本語

## 快速开始

### 1. 安装

在 VS Code 扩展市场搜索 `Better Submission` 并安装。

### 2. 配置

打开设置（`Ctrl+,`），搜索 `better-submission`：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `apiUrl` | OpenAI 兼容 API 端点 | `https://api.openai.com/v1` |
| `apiKey` | API 密钥 | — |
| `model` | 模型名称 | `gpt-4o` |
| `commitFormat` | 提交信息格式模板 | 内置 Conventional Commits |
| `systemPrompt` | 完全自定义系统提示词 | — |
| `language` | 提交消息语言 | `zh-CN` |
| `maxDiffLength` | Diff 最大字符数 | `8000` |
| `temperature` | 生成温度 | `0.3` |

### 3. 使用

1. 暂存你的更改（`git add`）
2. 在源代码管理面板标题栏点击 ✨ 按钮
3. 等待生成完成，提交消息将自动填入输入框

> 💡 如果输入框中已有文本，它会作为"额外意图说明"发送给 AI，帮助生成更符合你期望的消息。

## 端点配置示例

### DeepSeek
```json
{
  "better-submission.apiUrl": "https://api.deepseek.com/v1",
  "better-submission.model": "deepseek-chat",
  "better-submission.apiKey": "sk-..."
}
```

### 通义千问
```json
{
  "better-submission.apiUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "better-submission.model": "qwen-turbo",
  "better-submission.apiKey": "sk-..."
}
```

### Ollama（本地）
```json
{
  "better-submission.apiUrl": "http://localhost:11434/v1",
  "better-submission.model": "qwen2.5:7b",
  "better-submission.apiKey": "ollama"
}
```

## 自定义格式模板

在 `commitFormat` 中可以用自然语言描述你期望的格式：

```text
请使用以下格式：
emoji type(scope): 简短描述

详细变更列表...

其中 emoji 映射：feat→✨ fix→🐛 docs→📝 refactor→♻️
```

如果需要完全控制 AI 行为，使用 `systemPrompt` 覆盖内置提示词。

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听变更）
pnpm watch

# 构建
pnpm build

# 打包 VSIX
pnpm package
```

按 `F5` 启动 Extension Host 调试。

## 许可证

[AGPL-3.0](LICENSE)
