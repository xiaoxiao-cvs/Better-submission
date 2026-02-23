import * as vscode from "vscode";
import { simpleGit } from "simple-git";
import type {
  DiffResult,
  GitExtensionApi,
  GitRepository,
  ScmCommandArg,
} from "../types/index.js";

/**
 * Git 服务
 *
 * 封装 Git 仓库解析与 diff 获取逻辑。
 * 使用 VS Code Git 扩展 API 获取仓库引用，使用 simple-git 执行 diff 命令。
 */
export class GitService {
  /**
   * 从命令参数解析目标仓库
   *
   * 当通过 scm/title 菜单点击时，arg 包含 rootUri 用于匹配仓库。
   * 兜底取第一个可用仓库。
   */
  getRepository(arg?: ScmCommandArg): GitRepository | undefined {
    const gitExtension =
      vscode.extensions.getExtension<GitExtensionApi>("vscode.git");
    if (!gitExtension?.isActive) {
      return undefined;
    }

    const gitApi = gitExtension.exports.getAPI(1);
    const repos = gitApi.repositories;

    if (repos.length === 0) {
      return undefined;
    }

    // 从命令参数的 rootUri 匹配仓库
    if (arg?.rootUri) {
      const target = repos.find(
        (repo: GitRepository) =>
          repo.rootUri.toString() === arg.rootUri!.toString(),
      );
      if (target) {
        return target;
      }
    }

    // 兜底：使用第一个仓库
    return repos[0];
  }

  /** 检查指定仓库是否有暂存的变更 */
  async hasStagedChanges(repoPath: string): Promise<boolean> {
    const git = simpleGit(repoPath);
    const diff = await git.diff(["--staged", "--name-only"]);
    return diff.trim().length > 0;
  }

  /**
   * 获取暂存区的 diff 文本
   *
   * @param repoPath - 仓库根目录路径
   * @param maxLength - 最大字符数，超出自动截断
   */
  async getStagedDiff(
    repoPath: string,
    maxLength: number,
  ): Promise<DiffResult> {
    const git = simpleGit(repoPath);

    try {
      const diff = await git.diff(["--staged"]);

      if (!diff || diff.trim().length === 0) {
        return { diff: "", truncated: false, error: "暂存区没有变更" };
      }

      // 检查是否需要截断
      if (diff.length > maxLength) {
        const truncated = diff.substring(0, maxLength);
        // 在最后一个完整行处截断，避免破坏 diff 格式
        const lastNewline = truncated.lastIndexOf("\n");
        const cleanTruncated =
          lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

        return {
          diff: `${cleanTruncated}\n\n[... diff 已截断，原始长度 ${diff.length} 字符，显示前 ${maxLength} 字符 ...]`,
          truncated: true,
        };
      }

      return { diff, truncated: false };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "未知 Git 错误";
      return { diff: "", truncated: false, error: message };
    }
  }
}
