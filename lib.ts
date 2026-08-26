/**
 * 中文补全 + 使用频率排序（lib.ts）
 *
 * 输入 / 时接管补全提示层：
 *  - 每条命令显示中文说明（内置字典 + 插件/模板/skill 动态 + 用户翻译表）
 *  - 排序按【使用频率降序】→ 名称字母序（常用命令排前面）
 *  - 只影响提示显示；选中后插入原命令名，执行走 Pi 原逻辑；非 / 场景完全委托原补全
 */

import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// ---------- 用户数据文件 ----------
const USER_TABLE = path.join(os.homedir(), ".pi", "agent", "commands-cn.json");
const FREQ_FILE = path.join(os.homedir(), ".pi", "agent", "commands-frequency.json");

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (parsed && typeof parsed === "object") return parsed as T;
  } catch {
    // 文件不存在或损坏 → 默认值
  }
  return fallback;
}

function writeJsonFile(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function readUserTable(): Record<string, string> {
  return readJsonFile<Record<string, string>>(USER_TABLE, {});
}

export function writeUserTable(table: Record<string, string>): void {
  writeJsonFile(USER_TABLE, table);
}

export function readFrequency(): Record<string, number> {
  return readJsonFile<Record<string, number>>(FREQ_FILE, {});
}

function writeFrequency(freq: Record<string, number>): void {
  writeJsonFile(FREQ_FILE, freq);
}

/** 记录一次命令使用（写频率表） */
export function recordCommand(name: string): void {
  if (!name || typeof name !== "string") return;
  const clean = name.startsWith("/") ? name.slice(1) : name;
  if (!clean) return;
  const freq = readFrequency();
  freq[clean] = (freq[clean] ?? 0) + 1;
  writeFrequency(freq);
}

/** 清空使用频率 */
export function clearFrequency(): void {
  writeFrequency({});
}

// ---------- 内置命令中文表 ----------
export const BUILTIN_CN: Record<string, string> = {
  settings: "打开设置菜单（思考级别、主题等）",
  model: "切换模型（打开模型选择界面）",
  tree: "浏览会话树（跳回任意历史节点继续对话）",
  thinking: "设置思考级别",
  "scoped-models": "启用/禁用 Ctrl+P 循环切换的模型",
  export: "导出会话（默认 HTML，可指定 .html/.jsonl 路径）",
  import: "从 JSONL 文件导入并恢复会话",
  share: "将会话分享为私密 GitHub gist 并生成可分享链接",
  copy: "复制最后一条助手消息到剪贴板",
  name: "设置会话显示名称",
  session: "显示会话文件、ID、消息数、token 和费用",
  changelog: "显示版本更新记录",
  hotkeys: "显示所有键盘快捷键",
  fork: "从之前的一条用户消息创建分支会话",
  clone: "复制当前会话到当前位置，生成新会话",
  trust: "保存项目信任决定（用于以后的会话）",
  login: "配置提供商登录认证（OAuth 或 API Key）",
  logout: "移除提供商登录认证",
  new: "开始一个新会话",
  compact: "手动压缩会话上下文（释放空间）",
  resume: "从历史会话中选择并恢复",
  reload: "重载快捷键、扩展、技能、提示模板、主题和上下文文件",
  quit: "退出 Pi",
};

// ---------- 已装扩展 / 模板 / skill 命令中文表 ----------
export const PLUGIN_CN: Record<string, string> = {
  local: "本地模型管理（中文菜单）：输入 /local model 进入",

  // pi-web-access
  websearch: "打开网页搜索",
  curator: "切换或配置搜索精选流程（summary-review 等模式）",
  "google-account": "显示当前用于 Gemini Web 的 Google 账号",
  search: "浏览已保存的网页搜索结果",

  // pi-mcp-adapter
  mcp: "显示 MCP 服务器状态",
  "pi-mcp": "显示 MCP 服务器状态",
  "mcp-auth": "登录 MCP 服务器（OAuth 授权）",

  // pi-btw
  btw: "快速问一个不打扰主对话的附带小问题",

  // pi-plan-mode
  plan: "进入或管理 Codex 式计划模式（先规划再实施）",

  // pi-goal
  goal: "运行一个目标直到完成：/goal [--tokens 100k] <要完成的目标>",
  "claude-cache": "显示或设置本会话的 Claude 缓存保留时长（short/long/default）",

  // fusion（内置后台融合推理）
  fusion: "后台启动固定用途的 Fusion 推理并立即返回",
  "fusion-models": "打开五个槽位的全局 Fusion 模型选择器",

  // pi-background-tasks
  bg: "以后台任务方式运行一条命令：/bg [--agent] [--name \"任务名\"] <命令>",
  tasks: "打开后台任务管理界面",
  "bg-tasks": "打开后台任务管理界面",
  "bg-clear": "清除已结束后台任务的底部通知",
  "bg-update": "显示如何更新 pi-background-tasks 到最新版本",
  jobs: "列出运行中及最近的后台任务",
  logs: "查看后台任务的输出：/logs <id> [maxBytes]",
  kill: "停止一个运行中的后台任务：/kill <id>",

  // pi-subagents
  "subagents-watchdog": "显示或开关默认关闭的子代理看门狗",
  subagents: "管理子代理：查看元数据、更新模型/思考级别/提示词",
  run: "通过 workflowScript 运行一个子代理：/run agent[output=file] [task] [--bg] [--fork]",
  "subagent-cost": "显示本会话父代理和子代理的用量成本",
  "subagents-doctor": "显示子代理诊断信息",
  "subagents-inspect-rpc": "宿主集成桥接：回答子代理的异步检查请求（无模型轮次）",
  "subagents-guide": "显示子代理使用指南主题",
  "subagents-refine": "为某个子代理生成项目级优化配置",
  "subagents-fleet": "打开实时子代理舰队监视器",
  "subagents-detach": "分离当前前台单子代理运行而不终止它",
  "subagents-stop": "停止当前会话中的异步子代理运行",
  "prompt-workflow": "通过原生 pi-subagents 运行提示模板：/prompt-workflow <名称> [参数]",
  "subagents-models": "显示运行时加载的内置子代理模型",
  "subagents-profiles": "列出已保存的子代理配置",
  "subagents-load-profile": "将子代理配置加载到 ~/.pi/agent/settings.json",
  "subagents-refresh-provider-models": "刷新某个提供商的模型目录缓存",
  "subagents-generate-profiles": "生成 <provider>.quota 和 <provider>.quality 子代理配置",
  "subagents-check-profile": "检查已保存的配置是否仍指向可用模型",

  // rpiv-todo
  todos: "显示当前分支上的所有待办事项，按状态分组",

  // pi-hermes-memory
  "memory-consolidate": "手动触发记忆合并以释放空间",
  "memory-insights": "显示持久记忆中存储的内容",
  "memory-skills": "管理全局、当前项目和已加载的外部程序技能",
  "memory-interview": "回答几个问题预填您的用户画像，让代理跨会话记住您",
  "memory-switch-project": "切换项目级记忆的当前项目",
  "learn-memory-tool": "学习如何有效使用 pi-hermes-memory 扩展",
  "memory-sync-markdown": "将 SQLite 搜索镜像与 Markdown 记忆同步",
  "memory-preview-context": "预览记忆策略或旧版记忆上下文块",
  "memory-pin": "固定一条常驻指令，注入到每个会话",
  "memory-index-sessions": "将过去的 Pi 会话导入搜索数据库",

  // llama.cpp
  llama: "管理 llama.cpp 路由模型（下载/加载/卸载）",

  // prompt 模板
  council: "运行有监督的顾问评审团并写出决策备忘录",
  "gather-context-and-clarify": "用子代理收集上下文，然后提出澄清问题",
  "parallel-cleanup": "并行清理审查",
  "parallel-research": "并行子代理研究",
  "parallel-review": "并行子代理审查",
  "review-loop": "循环审查/修复直到干净",

  // skills
  "skill:edge-tts": "Edge TTS 语音合成：文字转语音、朗读、播放音频",
  "skill:playwright-cli": "浏览器自动化：测试网页、操作浏览器、跑 Playwright 测试",
  "skill:mcp-scripting": "编写 mcpScript JavaScript：发现、检查、调用 MCP 工具",
  "skill:council-mode": "运行有监督的顾问评审团模式（/council）",
  "skill:pi-subagents": "委派工作给内置或自定义子代理（单代理/并行/链式/异步等）",
};

// ---------- 翻译查询 ----------
/** 合并：用户表优先 > 内置 > 插件表 > undefined（走英文兜底） */
export function translate(name: string, fallback: string | undefined): string {
  const user = readUserTable();
  const cn = user[name] ?? BUILTIN_CN[name] ?? PLUGIN_CN[name];
  return cn ?? fallback ?? "";
}

// ---------- 补全提供者 ----------
interface SlashEntry {
  name: string;
  description?: string;
}

let currentProvider: any;

/** 按使用频率降序排序；频率相同按名称字母序 */
function sortByFrequency(entries: SlashEntry[]): SlashEntry[] {
  const freq = readFrequency();
  return [...entries].sort((a, b) => {
    const fa = freq[a.name] ?? 0;
    const fb = freq[b.name] ?? 0;
    if (fa !== fb) return fb - fa;
    return a.name.localeCompare(b.name);
  });
}

/** 从补全选中值提取命令名并记录使用 */
export function recordFromValue(value: string): void {
  const m = /^\/([^\s/]+)/.exec(value ?? "");
  if (m) recordCommand(m[1]);
}

/** 从输入文本提取命令名并记录使用 */
export function recordFromInput(text: string): void {
  const t = (text ?? "").trim();
  if (!t.startsWith("/")) return;
  const m = /^\/([^\s/]+)/.exec(t);
  if (m) recordCommand(m[1]);
}

export function buildProvider(pi: ExtensionAPI, current: any) {
  // 记录最近一次补全是否由原逻辑提供（用于 applyCompletion 分流）
  let delegated = false;
  return {
    triggerCharacters: ["/"],
    async getSuggestions(
      lines: string[],
      cursorLine: number,
      cursorCol: number,
      options: { signal: AbortSignal; force?: boolean },
    ) {
      const line = lines[cursorLine] ?? "";
      const beforeCursor = line.slice(0, cursorCol);

      // 非 / 场景：完全委托原逻辑（保留 @ 文件补全、路径补全等全部行为）
      const match = beforeCursor.match(/(?:^|[ \t])\/([^\s/]*)$/);
      if (!match) {
        delegated = true;
        return current.getSuggestions(lines, cursorLine, cursorCol, options);
      }
      delegated = false;

      const typed = match[1] ?? "";
      const prefix = `/${typed}`;

      // 内置命令（中文表）
      const builtin: SlashEntry[] = Object.keys(BUILTIN_CN).map((name) => ({
        name,
        description: BUILTIN_CN[name],
      }));

      // 动态获取：当前所有扩展 / 模板 / skill 命令（含以后新装的）
      let dynamic: SlashEntry[] = [];
      try {
        const commands = pi.getCommands();
        dynamic = commands.map((c) => ({ name: c.name, description: c.description }));
      } catch {
        // getCommands 不可用时仅用内置表
      }

      // 合并去重（内置优先；skill 用原 name）
      const seen = new Set<string>();
      const entries: SlashEntry[] = [];
      for (const e of [...builtin, ...dynamic]) {
        if (seen.has(e.name)) continue;
        seen.add(e.name);
        entries.push(e);
      }

      const items = entries
        .filter((e) => e.name.startsWith(typed))
        .sort((a, b) => {
          // 使用频率降序 → 名称字母序
          const freq = readFrequency();
          const fa = freq[a.name] ?? 0;
          const fb = freq[b.name] ?? 0;
          if (fa !== fb) return fb - fa;
          return a.name.localeCompare(b.name);
        })
        .map((e) => ({
          value: `/${e.name}`,
          label: `/${e.name}`,
          description: translate(e.name, e.description),
        }));

      return { prefix, items };
    },
    applyCompletion(
      lines: string[],
      cursorLine: number,
      cursorCol: number,
      item: { value: string; label: string; description?: string },
      prefix: string,
    ) {
      // 记录使用频率（命令场景）
      if (!delegated) recordFromValue(item.value);
      // 命令场景（我们提供的建议）：自己控制插入，保证不会重复加斜杠
      if (delegated && currentProvider?.applyCompletion) {
        return currentProvider.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
      }
      return fallbackApply(lines, cursorLine, cursorCol, item, prefix);
    },
    shouldTriggerFileCompletion(
      lines: string[],
      cursorLine: number,
      cursorCol: number,
    ) {
      // 非 / 场景的文件补全（@ 等）保持原行为
      return currentProvider?.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
    },
  };
}

export function setCurrentProvider(p: any): void {
  currentProvider = p;
}

// 兜底插入：把 prefix 替换为 item.value
function fallbackApply(
  lines: string[],
  cursorLine: number,
  cursorCol: number,
  item: { value: string },
  prefix: string,
) {
  const line = lines[cursorLine] ?? "";
  const idx = line.lastIndexOf(prefix, cursorCol);
  const start = idx >= 0 ? idx : cursorCol - prefix.length;
  const next = line.slice(0, start) + item.value + line.slice(cursorCol);
  const nextLines = [...lines];
  nextLines[cursorLine] = next;
  return {
    lines: nextLines,
    cursorLine,
    cursorCol: start + item.value.length,
  };
}

// ---------- 交互补充翻译（/汉化） ----------
export async function flowTranslate(ctx: any, pi: ExtensionAPI): Promise<void> {
  if (!ctx.hasUI) {
    ctx.ui.notify("请在交互式界面中使用 /汉化", "warning");
    return;
  }
  let dynamic: { name: string; description?: string }[] = [];
  try {
    dynamic = pi.getCommands().map((c) => ({ name: c.name, description: c.description }));
  } catch {
    dynamic = [];
  }
  const user = readUserTable();
  const untranslated = dynamic.filter(
    (e) => !user[e.name] && !BUILTIN_CN[e.name] && !PLUGIN_CN[e.name],
  );
  if (untranslated.length === 0) {
    ctx.ui.notify("当前所有命令都已汉化，没有未翻译的命令。", "info");
    return;
  }
  const options = untranslated.map((e) => `${e.name}（${e.description ?? "无说明"}）`);
  const picked = await ctx.ui.select(`还有 ${untranslated.length} 条命令未汉化，选择要翻译的：`, options);
  if (!picked) {
    ctx.ui.notify("已取消。", "info");
    return;
  }
  const idx = options.indexOf(picked);
  const target = untranslated[idx];
  const cn = await ctx.ui.input(`请输入「${target.name}」的中文说明（当前英文：${target.description ?? "无"}）：`, "");
  if (cn === undefined || !cn.trim()) {
    ctx.ui.notify("已取消，未保存。", "info");
    return;
  }
  user[target.name] = cn.trim();
  writeUserTable(user);
  ctx.ui.notify(`✅ 已保存「${target.name}」的中文说明，立即生效。`, "info");
}
