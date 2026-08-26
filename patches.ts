/**
 * 界面文本汉化补丁模块（patches.ts）
 *
 * 把 Pi 主程序 + 各插件 TUI 界面中的"说明文字与界面提示"翻译成中文。
 * 目标（动态定位，升级后自动恢复）：
 *   - Pi 主程序：bundle 主 chunk（含所有交互界面文本）
 *   - pi-plan-mode：菜单 chunk + dist/index.ts 状态/通知
 *   - pi-tui-kit：底部导航提示（navigate/select/close/back）
 *   - pi-web-access：Gemini 提示
 * 只改纯显示文本；label/逻辑值/命令名一律不动；备份 .bak、语法校验、幂等。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { PLAN_MODE_UI_MAP, PLAN_MODE_STATUS_MAP, TUI_KIT_MAP } from "./plan-cn-data.ts";
import { GOAL_MENU_MAP, GOAL_SETTINGS_MAP, GOAL_CORE_MAP, GOAL_INDEX_MAP } from "./goal-cn-data.ts";
import { BTW_MAP } from "./btw-cn-data.ts";

// ---------- 映射 ----------
const MAIN_MAP: Array<[string, string]> = [["Maximum idle gap while waiting for HTTP headers or body chunks. Disable for local models that pause longer than five minutes.","等待 HTTP 头或响应体的最大空闲时间。本地模型停顿超过五分钟时可关闭。"],["Enter while streaming queues steering messages. 'one-at-a-time': deliver one, wait for response. 'all': deliver all at once.","输入时按回车会排队转向消息。'one-at-a-time'：一次发送一条并等待响应。'all'：一次性全部发送。"],["Could not refresh ${result.errors.size} model catalogs (${[...result.errors.keys()].join(\", \")}); showing cached models.","无法刷新 ${result.errors.size} 个模型目录（${[...result.errors.keys()].join(\", \")}）；显示缓存的模型。"],["Override the default thinking level for specific models. ${cycleThinkingKey} cycles in-session.","为特定模型覆盖默认思考级别。${cycleThinkingKey} 在会话内循环切换。"],["Could not refresh model catalogs: ${error instanceof Error ? error.message : String(error)}","无法刷新模型目录：${error instanceof Error ? error.message : String(error)}"],["  No named sessions in current folder. Press ${toggleKey} to show all, or Tab to view all.","  当前文件夹没有已命名的会话。按 ${toggleKey} 显示全部，或按 Tab 查看全部。"],["Saved decision: ${formatDecision(this.trustOptions[0]?.savedPath, options.savedDecision)}","已保存的决定：${formatDecision(this.trustOptions[0]?.savedPath, options.savedDecision)}"],["Fallback behavior when no extension or saved trust decision decides project trust","当没有扩展或已保存的信任决定时，项目信任的回退行为"],["Show transcript notices for significant prompt-cache misses and compaction costs","在提示缓存未命中和压缩成本显著时显示记录通知"],["Print the transcript or only a session resume hint when exiting fullscreen mode","退出全屏模式时输出完整记录或仅输出会话恢复提示"],["Could not refresh ${result.errors.keys().next().value}; showing cached models.","无法刷新 ${result.errors.keys().next().value}；显示缓存的模型。"],["Only showing models from configured providers. Use /login to add providers.","仅显示已配置提供商的模型。使用 /login 添加提供商。"],["Send an anonymous version/update ping after changelog-detected updates","检测到更新后发送匿名版本/更新回执"],["Horizontal padding for user messages, assistant messages, and thinking","用户消息、助手消息和思考的水平内边距"],["Scrollbar behavior in fullscreen mode; has no effect in regular mode","全屏模式下的滚动条行为；普通模式下无效"],["Current session: ${options.projectTrusted ? \"trusted\" : \"untrusted\"}","当前会话：${options.projectTrusted ? \"已信任\" : \"未信任\"}"],["No matching package found for ${source}. Did you mean ${suggestion}?","未找到匹配 ${source} 的包。您是不是想找 ${suggestion}？"],["Resize large images to 2000x2000 max for better model compatibility","将大图缩放至最大 2000x2000，以获得更好的模型兼容性"],["Show the terminal cursor while still positioning it for IME support","显示终端光标（同时为 IME 支持定位）"],["  Enter to select \\xB7 Ctrl+S to set as default \\xB7 Esc to cancel","  回车选择 · Ctrl+S 设为默认 · Esc 取消"],["Select a theme, or choose Automatic to follow terminal appearance.","选择主题，或选择 Automatic 跟随终端外观。"],["Preferred transport for providers that support multiple transports","为支持多种传输方式的提供商选择首选传输"],["Project is not trusted; refusing to access project package storage","项目未受信任；拒绝访问项目包存储"],["Refusing to use path outside package install root: ${resolvedPath}","拒绝使用包安装根目录之外的路径：${resolvedPath}"],["Warn when Anthropic subscription auth may use paid extra usage","当 Anthropic 订阅认证可能产生付费额外用量时警告"],["Select authentication method for ${providerOptions[0].name}:","为 ${providerOptions[0].name} 选择认证方式："],["Thinking Level for ${m ? modelDisplayLabel(m) : ctx.model}","模型 ${m ? modelDisplayLabel(m) : ctx.model} 的思考级别"],["Use separate themes for light and dark terminal appearance","为浅色和深色终端分别使用主题"],["  No named sessions found. Press ${toggleKey} to show all.","  未找到已命名的会话。按 ${toggleKey} 显示全部。"],["  Type to filter \\xB7 Enter to select \\xB7 Esc to go back","  输入过滤 · 回车选择 · Esc 返回"],["Theme to use in automatic mode when the terminal is light","自动模式下终端为浅色时使用的主题"],["Clear empty rows when content shrinks (may cause flicker)","内容缩小时清除空行（可能闪烁）"],["Theme to use in automatic mode when the terminal is dark","自动模式下终端为深色时使用的主题"],["Show OSC 9;4 progress indicators in the terminal tab bar","在终端标签栏显示 OSC 9;4 进度指示"],["  No sessions in current folder. Press Tab to view all.","  当前文件夹没有会话。按 Tab 查看全部。"],["Choose themes for terminal light and dark appearance.","为终端浅色和深色外观选择主题。"],["Select the theme to use for light terminal appearance","选择浅色终端外观使用的主题"],["Select the theme to use for dark terminal appearance","选择深色终端外观使用的主题"],["Automatically compact context when it gets too large","上下文过大时自动压缩"],["Action when pressing Escape twice with empty editor","编辑器为空时连续按两次 Esc 的行为"],["Revert to global default (${config.thinkingLevel})","恢复为全局默认（${config.thinkingLevel}）"],["Log in to a provider or configure an API key first","请先登录提供商或配置 API Key"],["New version ${release.version} is available. Run ","新版本 ${release.version} 可用。运行 "],["Interface layout; fullscreen mode is experimental","界面布局；全屏模式为实验性"],["Max visible items in autocomplete dropdown (3-20)","自动补全下拉框的最大可见项数（3-20）"],["modes/interactive/components/thinking-selector.js","深度推理（约 16k tokens）"],["Model refresh timed out; showing cached models.","模型刷新超时；显示缓存的模型。"],["Light/dark detection requires terminal support.","浅色/深色检测需要终端支持。"],["Prevent images from being sent to LLM providers","阻止图片发送给 LLM 提供商"],["Render Mermaid code blocks as Unicode diagrams","将 Mermaid 代码块渲染为 Unicode 图形"],["Preferred inline image width in terminal cells","终端中内联图片的优选宽度"],["Select default thinking level for this model","为此模型选择默认思考级别"],["trash: ${parts.join(\" \\xB7 \").slice(0, 200)}","回收站：${parts.join(\" · \").slice(0, 200)}"],["Hide thinking blocks in assistant responses","在助手回复中隐藏思考块"],["${label} (inherited from ${decision.path})","${label}（继承自 ${decision.path}）"],["Cannot delete the currently active session","无法删除当前正在使用的会话"],["Horizontal padding for input editor (0-3)","输入编辑器的水平内边距（0-3）"],["${LEVEL_DESCRIPTIONS[level]} \\xB7 default","${LEVEL_DESCRIPTIONS[level]} · 默认"],["Register skills as /skill:name commands","将技能注册为 /skill:name 命令"],["No matching package found for ${source}","未找到匹配 ${source} 的包"],["Switch to one theme for light and dark","切换为单一主题（不分深浅色）"],["Show condensed changelog after updates","更新后显示简短的更新日志"],["  Enter to select \\xB7 Esc to go back","  回车选择 · Esc 返回"],["Enable or disable individual warnings","启用或禁用各项警告"],["modes/interactive/interactive-mode.js","有可用的包更新"],["  Model Name: ${selected.model.name}","  模型名称：${selected.model.name}"],["Package updates are available. Run ","有可用的包更新。运行 "],["Disable verbose printing at startup","启动时关闭详细输出"],["Failed to load sessions: ${message}","加载会话失败：${message}"],["Extra-high reasoning (~32k tokens)","超深度推理（约 32k tokens）"],["Very brief reasoning (~1k tokens)","非常简短的推理（约 1k tokens）"],["Default filter when opening /tree","打开 /tree 时的默认过滤方式"],["Failed to delete: ${errorMessage}","删除失败：${errorMessage}"],["Updating ${scope} npm packages...","正在更新 ${scope} 的 npm 包..."],["Missing source: ${resolvedSource}","缺少源：${resolvedSource}"],["Render images inline in terminal","在终端中内联渲染图片"],["Updating ${sources[0].source}...","正在更新 ${sources[0].source}..."],["Path does not exist: ${resolved}","路径不存在：${resolved}"],["${modelName} \\u2022 thinking off","${modelName} • 思考关闭"],["Moderate reasoning (~8k tokens)","中度推理（约 8k tokens）"],["Resume Session (Current Folder)","恢复会话（当前文件夹）"],["Refreshing model catalogs\\u2026","正在刷新模型目录…"],["Select authentication method:","选择认证方式："],["Color theme for the interface","界面的颜色主题"],["Light reasoning (~2k tokens)","轻度推理（约 2k tokens）"],["Deep reasoning (~16k tokens)","深度推理（约 16k tokens）"],["No login methods available.","没有可用的登录方式。"],["Select a model to configure","选择要配置的模型"],["${label} (${decision.path})","${label}（${decision.path}）"],["Updating ${entry.source}...","正在更新 ${entry.source}..."],["Warning: ${warningMessage}","警告：${warningMessage}"],["Refreshing ${sourceStr}...","正在刷新 ${sourceStr}..."],["Package Updates Available","有可用的包更新"],["Model catalogs refreshed.","模型目录已刷新。"],["Per-Model Thinking Level","各模型思考级别"],["Label (empty to remove):","标签（留空删除）："],["Sign in with an account","使用账号登录"],["Sign in with an API key","使用 API Key 登录"],["Installing ${source}...","正在安装 ${source}..."],["Session moved to trash","会话已移到回收站"],["Removing ${source}...","正在移除 ${source}..."],["  No matching models","  没有匹配的模型"],["Resume Session (All)","恢复会话（全部）"],["No models available","没有可用模型"],["  No sessions found","  没有找到会话"],["  No entries found","  没有找到条目"],["Maximum reasoning","最大推理"],["Update Available","有可用更新"],["Save and go back","保存并返回"],["(clear override)","（清除覆盖）"],["Delete session? ","删除会话？ "],["Automatic Theme","自动主题"],["Type to search:","输入搜索："],["Session deleted","会话已删除"],["Thinking Level","思考级别"],["  Session Tree","  会话树"],["Rename Session","重命名会话"],["Current folder","当前文件夹"],["\"Changelog: \"","\"更新日志：\""],[" (all/scoped)","（全部/限定）"],["Project trust","项目信任"],["Unknown error","未知错误"],[" \\xB7 default"," · 默认"],["No reasoning","无推理"],["no results","无结果"],["Packages:","包："],["Scope: ","范围："],[" (auto)","（自动）"],["Sort: ","排序："],["Name: ","名称："]];

const WEB_ACCESS_MAP: Record<string, Array<[string, string]>> = {
  "index.ts": [
    [
      "Gemini Web browser cookie access is disabled. Set allowBrowserCookies: true in ${WEB_SEARCH_CONFIG_PATH} to enable it.",
      "Gemini Web 浏览器 Cookie 访问已被禁用。在 ${WEB_SEARCH_CONFIG_PATH} 中设置 allowBrowserCookies: true 以启用。",
    ],
    [
      "Gemini Web is unavailable: ${diagnostic}",
      "Gemini Web 不可用：${diagnostic}",
    ],
    [
      "Gemini Web is unavailable. Sign into gemini.google.com in a supported Chromium-based browser.",
      "Gemini Web 不可用。请在受支持的 Chromium 系浏览器中登录 gemini.google.com。",
    ],
  ],
};

// 映射版本指纹（条目数变化即需重新应用）
const MAP_VERSION =
  MAIN_MAP.length +
  PLAN_MODE_UI_MAP.length +
  PLAN_MODE_STATUS_MAP.length +
  TUI_KIT_MAP.length +
  GOAL_MENU_MAP.length +
  GOAL_SETTINGS_MAP.length +
  GOAL_CORE_MAP.length +
  GOAL_INDEX_MAP.length +
  BTW_MAP.length +
  Object.values(WEB_ACCESS_MAP).reduce((n, p) => n + p.length, 0);

const MARKER_FILE = path.join(homedir(), ".pi", "agent", "pi-cn-patch.json");
interface PatchMarker { mapVersion: number; chunkFile?: string; }

function readMarker(): PatchMarker | undefined {
  try {
    const p = JSON.parse(fs.readFileSync(MARKER_FILE, "utf8"));
    if (p && typeof p === "object") return p as PatchMarker;
  } catch { /* 无标记 */ }
  return undefined;
}
function writeMarker(marker: PatchMarker): void {
  fs.mkdirSync(path.dirname(MARKER_FILE), { recursive: true });
  fs.writeFileSync(MARKER_FILE, JSON.stringify(marker, null, 2) + "\n", "utf8");
}

// ---------- 定位 ----------
export function findPiDist(): string | undefined {
  const home = homedir();
  const candidates = [
    path.join(home, ".bun", "install", "global", "node_modules", "@earendil-works", "pi-coding-agent", "dist"),
    path.join(home, ".local", "lib", "node_modules", "@earendil-works", "pi-coding-agent", "dist"),
    "/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/dist",
    "/usr/lib/node_modules/@earendil-works/pi-coding-agent/dist",
  ];
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "pi-cn.json"), "utf8"));
    if (typeof cfg?.piDist === "string" && fs.existsSync(cfg.piDist)) candidates.unshift(cfg.piDist);
  } catch { /* 无自定义配置 */ }
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "bundle", "cli.js"))) return c;
  }
  return undefined;
}

function findMainChunk(dist: string): string | undefined {
  const marker = readMarker();
  if (marker?.chunkFile) {
    const cached = path.join(dist, "bundle", "chunks", marker.chunkFile);
    if (fs.existsSync(cached)) return cached;
  }
  const chunksDir = path.join(dist, "bundle", "chunks");
  if (!fs.existsSync(chunksDir)) return undefined;
  for (const f of fs.readdirSync(chunksDir)) {
    if (!f.endsWith(".js") || f.endsWith(".bak")) continue;
    const p = path.join(chunksDir, f);
    try {
      if (fs.readFileSync(p, "utf8").includes("No reasoning")) return p;
    } catch { /* 跳过 */ }
  }
  return undefined;
}

export function findWebAccessDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "pi-web-access");
  return fs.existsSync(path.join(p, "index.ts")) ? p : undefined;
}

function findPlanModeDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-plan-mode");
  return fs.existsSync(path.join(p, "dist")) ? p : undefined;
}

function findPlanUiChunk(dir: string): string | undefined {
  const chunksDir = path.join(dir, "dist", "chunks");
  if (!fs.existsSync(chunksDir)) return undefined;
  for (const f of fs.readdirSync(chunksDir)) {
    if (!f.endsWith(".js") || f.endsWith(".bak")) continue;
    const p = path.join(chunksDir, f);
    try {
      if (fs.readFileSync(p, "utf8").includes("Start Plan mode")) return p;
    } catch { /* 跳过 */ }
  }
  return undefined;
}

function findTuiKitRendering(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-tui-kit", "dist", "components", "rendering.js");
  return fs.existsSync(p) ? p : undefined;
}

function findGoalDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-goal");
  return fs.existsSync(path.join(p, "dist")) ? p : undefined;
}

function findGoalChunkByMarker(marker: string): string | undefined {
  const dir = findGoalDir();
  if (!dir) return undefined;
  const chunksDir = path.join(dir, "dist", "chunks");
  if (!fs.existsSync(chunksDir)) return undefined;
  for (const f of fs.readdirSync(chunksDir)) {
    if (!f.endsWith(".js") || f.endsWith(".bak")) continue;
    const p = path.join(chunksDir, f);
    try {
      if (fs.readFileSync(p, "utf8").includes(marker)) return p;
    } catch { /* 跳过 */ }
  }
  return undefined;
}

function findBtwDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-btw");
  return fs.existsSync(path.join(p, "dist", "index.ts")) ? p : undefined;
}

// ---------- 结果类型 ----------
export interface PatchResult {
  appliedFiles: number;
  appliedCount: number;
  skipped: boolean;
  missingFiles: string[];
  errors: string[];
  alreadyHanhua: boolean;
}

function emptyResult(): PatchResult {
  return { appliedFiles: 0, appliedCount: 0, skipped: true, missingFiles: [], errors: [], alreadyHanhua: false };
}

function applyToFile(p: string, pairs: Array<[string, string]>): { hits: number; error?: string } {
  let src = fs.readFileSync(p, "utf8");
  const orig = src;
  let hits = 0;
  for (const [old, nw] of pairs) {
    // 幂等保护：若 new 已存在于文件（上次已替换），则跳过，避免“英文+注释”叠加
    if (src.includes(old) && !src.includes(nw)) {
      src = src.split(old).join(nw);
      hits++;
    }
  }
  if (hits === 0) return { hits: 0 };
  if (!fs.existsSync(p + ".bak")) fs.copyFileSync(p, p + ".bak");
  fs.writeFileSync(p, src, "utf8");
  try {
    execFileSync(process.execPath, ["--check", p], { stdio: "pipe" });
  } catch {
    fs.writeFileSync(p, orig, "utf8");
    return { hits: 0, error: p.split(/[\\/]/).pop() + " 语法校验失败，已还原" };
  }
  return { hits };
}

function applyOneFile(p: string | undefined, pairs: Array<[string, string]>, label: string): PatchResult {
  const result = emptyResult();
  result.skipped = false;
  if (!p) {
    result.missingFiles.push(label);
    result.skipped = true;
    return result;
  }
  const r = applyToFile(p, pairs);
  if (r.error) result.errors.push(r.error);
  if (r.hits > 0) {
    result.appliedFiles = 1;
    result.appliedCount = r.hits;
  }
  return result;
}

// ---------- 应用 ----------
export function applyPatches(dist: string): PatchResult {
  const chunk = findMainChunk(dist);
  const result: PatchResult = { appliedFiles: 0, appliedCount: 0, skipped: false, missingFiles: chunk ? [] : ["主 chunk"], errors: [], alreadyHanhua: false };
  if (!chunk) return result;
  const marker = readMarker();
  if (marker?.mapVersion === MAP_VERSION) {
    if (fs.readFileSync(chunk, "utf8").includes("深度推理（约 16k tokens）")) {
      result.alreadyHanhua = true;
      result.skipped = true;
      return result;
    }
  }
  const r = applyToFile(chunk, MAIN_MAP);
  if (r.error) result.errors.push(r.error);
  if (r.hits > 0) { result.appliedFiles = 1; result.appliedCount = r.hits; }
  writeMarker({ mapVersion: MAP_VERSION, chunkFile: path.basename(chunk) });
  return result;
}

export function applyWebAccessPatches(): PatchResult {
  const root = findWebAccessDir();
  const result = emptyResult();
  result.skipped = false;
  if (!root) { result.skipped = true; result.missingFiles.push("pi-web-access"); return result; }
  for (const rel of Object.keys(WEB_ACCESS_MAP)) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) { result.missingFiles.push(rel); continue; }
    const r = applyToFile(p, WEB_ACCESS_MAP[rel]);
    if (r.error) result.errors.push(r.error);
    if (r.hits > 0) { result.appliedFiles++; result.appliedCount += r.hits; }
  }
  return result;
}

export function applyPlanModePatches(): { ui: PatchResult; status: PatchResult } {
  const dir = findPlanModeDir();
  if (!dir) {
    const missing = emptyResult();
    missing.missingFiles.push("pi-plan-mode");
    return { ui: missing, status: missing };
  }
  const uiChunk = findPlanUiChunk(dir);
  const statusFile = path.join(dir, "dist", "index.ts");
  return {
    ui: applyOneFile(uiChunk, PLAN_MODE_UI_MAP, "pi-plan-mode 菜单 chunk"),
    status: applyOneFile(fs.existsSync(statusFile) ? statusFile : undefined, PLAN_MODE_STATUS_MAP, "pi-plan-mode index.ts"),
  };
}

export function applyTuiKitPatches(): PatchResult {
  return applyOneFile(findTuiKitRendering(), TUI_KIT_MAP, "pi-tui-kit rendering.js");
}

export function applyGoalPatches(): { menu: PatchResult; settings: PatchResult; core: PatchResult; index: PatchResult } {
  const dir = findGoalDir();
  if (!dir) {
    const missing = emptyResult();
    missing.missingFiles.push("pi-goal");
    return { menu: missing, settings: missing, core: missing, index: missing };
  }
  const indexFile = path.join(dir, "dist", "index.ts");
  return {
    menu: applyOneFile(findGoalChunkByMarker("Start a goal"), GOAL_MENU_MAP, "pi-goal 菜单 chunk"),
    settings: applyOneFile(findGoalChunkByMarker("Pi Goal Settings"), GOAL_SETTINGS_MAP, "pi-goal 设置 chunk"),
    core: applyOneFile(findGoalChunkByMarker("Pause the active goal"), GOAL_CORE_MAP, "pi-goal 核心 chunk"),
    index: applyOneFile(fs.existsSync(indexFile) ? indexFile : undefined, GOAL_INDEX_MAP, "pi-goal index.ts"),
  };
}

export function applyBtwPatches(): PatchResult {
  const dir = findBtwDir();
  return applyOneFile(dir ? path.join(dir, "dist", "index.ts") : undefined, BTW_MAP, "pi-btw index.ts");
}

export function applyAllPatches(): {
  pi: PatchResult;
  webAccess: PatchResult;
  planMode: { ui: PatchResult; status: PatchResult };
  tuiKit: PatchResult;
  goal: { menu: PatchResult; settings: PatchResult; core: PatchResult; index: PatchResult };
  btw: PatchResult;
  auto: PatchResult;
} {
  const dist = findPiDist();
  return {
    pi: dist ? applyPatches(dist) : emptyResult(),
    webAccess: applyWebAccessPatches(),
    planMode: applyPlanModePatches(),
    tuiKit: applyTuiKitPatches(),
    goal: applyGoalPatches(),
    btw: applyBtwPatches(),
    auto: applyAutoPatches(),
  };
}

// ---------- 状态 ----------
export function allPatchStatus(): Array<{ target: string; file: string; hanhua: boolean; backup: boolean }> {
  const list: Array<{ target: string; file: string; hanhua: boolean; backup: boolean }> = [];
  const push = (target: string, p: string | undefined, marker: string) => {
    if (!p || !fs.existsSync(p)) return;
    list.push({
      target,
      file: path.basename(p),
      hanhua: fs.readFileSync(p, "utf8").includes(marker),
      backup: fs.existsSync(p + ".bak"),
    });
  };
  const dist = findPiDist();
  push("Pi 主程序", dist ? findMainChunk(dist) : undefined, "深度推理（约 16k tokens）");
  const root = findWebAccessDir();
  if (root) push("pi-web-access", path.join(root, "index.ts"), "Gemini Web 浏览器 Cookie 访问已被禁用");
  const dir = findPlanModeDir();
  if (dir) {
    push("pi-plan-mode 菜单", findPlanUiChunk(dir), "开始计划模式");
    push("pi-plan-mode 状态", path.join(dir, "dist", "index.ts"), "计划模式：规划中");
  }
  push("pi-tui-kit", findTuiKitRendering(), "导航");
  const goalDir = findGoalDir();
  if (goalDir) {
    push("pi-goal 菜单", findGoalChunkByMarker("Start a goal"), "开始目标");
    push("pi-goal 设置", findGoalChunkByMarker("Pi Goal Settings"), "Pi Goal 设置");
    push("pi-goal 核心", findGoalChunkByMarker("Pause the active goal"), "用法：");
    push("pi-goal 状态", path.join(goalDir, "dist", "index.ts"), "没有活动目标");
  }
  const btwDir = findBtwDir();
  if (btwDir) push("pi-btw", path.join(btwDir, "dist", "index.ts"), "Pi 侧线程");
  return list;
}

const ALL_HANHUA_PAIRS: Array<[string, string]> = [
  ...MAIN_MAP,
  ...PLAN_MODE_UI_MAP, ...PLAN_MODE_STATUS_MAP, ...TUI_KIT_MAP,
  ...GOAL_MENU_MAP, ...GOAL_SETTINGS_MAP, ...GOAL_CORE_MAP, ...GOAL_INDEX_MAP,
  ...BTW_MAP,
  ...Object.values(WEB_ACCESS_MAP).flat(),
];

// ---------- 自动汉化：白名单上下文提取 + 动态映射 ----------
// 只提取明确“界面位置”（label/title/hint/placeholder/ui.*）里的英文文本，
// 天然避开给 AI 的 prompt 与工具定义（它们不经过这些界面 API）。
const AUTO_CONTEXT_PATTERNS: RegExp[] = [
  /label:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`)/g,
  /title:\s*("(?:\\.|[^"\\])*")/g,
  /placeholder:\s*("(?:\\.|[^"\\])*")/g,
  /ui\.notify\(\s*("(?:\\.|[^"\\])*")/g,
  /ui\.confirm\(\s*("(?:\\.|[^"\\])*")/g,
  /ui\.editor\(\s*("(?:\\.|[^"\\])*")/g,
  /ui\.input\(\s*("(?:\\.|[^"\\])*")/g,
  /ui\.select\(\s*("(?:\\.|[^"\\])*")/g,
  /notifyTerminal\(\s*ctx\.ui,\s*("(?:\\.|[^"\\])*")/g,
];

const AUTO_FILE = path.join(homedir(), ".pi", "agent", "hanhua-auto.json");

function decodeEscapes(s: string): string {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function extractAutoCandidates(src: string): Array<{ old: string; display: string }> {
  const out: Array<{ old: string; display: string }> = [];
  const seen = new Set<string>();
  for (const re of AUTO_CONTEXT_PATTERNS) {
    let m;
    while ((m = re.exec(src))) {
      const quoted = m[1];
      const display = decodeEscapes(quoted.slice(1, -1));
      if (/[\u4e00-\u9fff]/.test(display)) continue; // 已汉化
      if (!/[A-Za-z]/.test(display)) continue;
      if (!/\s/.test(display)) continue; // 只保留含空格的多词（单词语通常为逻辑值/短标签）
      if (display.includes("${")) continue; // 动态模板跳过
      if (seen.has(quoted)) continue;
      seen.add(quoted);
      out.push({ old: quoted, display });
    }
  }
  return out;
}

function isPiPlugin(pkgDir: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    return !!pkg.pi || (Array.isArray(pkg.keywords) && (pkg.keywords.includes("pi-package") || pkg.keywords.includes("pi-extension")));
  } catch {
    return false;
  }
}

function walkDist(dir: string, files: string[]): void {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walkDist(p, files); continue; }
    if ((e.name.endsWith(".js") || e.name.endsWith(".ts")) && !e.name.endsWith(".bak") && !e.name.endsWith(".map")) {
      files.push(p);
    }
  }
}

function enumeratePluginFiles(): string[] {
  const home = homedir();
  const roots = [
    path.join(home, ".pi", "agent", "npm", "node_modules"),
    path.join(home, ".pi", "agent", "extensions"),
  ];
  const files: string[] = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    let entries;
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { continue; }
    const pkgDirs: string[] = [];
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (e.name.startsWith("@")) {
        let scoped;
        try { scoped = fs.readdirSync(path.join(root, e.name), { withFileTypes: true }); } catch { scoped = []; }
        for (const se of scoped) if (se.isDirectory()) pkgDirs.push(path.join(root, e.name, se.name));
      } else if (e.isDirectory()) {
        pkgDirs.push(path.join(root, e.name));
      }
    }
    for (const pkgDir of pkgDirs) {
      if (!isPiPlugin(pkgDir)) continue;
      const dist = path.join(pkgDir, "dist");
      if (fs.existsSync(dist)) walkDist(dist, files);
    }
  }
  return files;
}

function readAutoMap(): Record<string, Array<[string, string]>> {
  try {
    const p = JSON.parse(fs.readFileSync(AUTO_FILE, "utf8"));
    if (p && typeof p === "object") return p as Record<string, Array<[string, string]>>;
  } catch { /* 无 */ }
  return {};
}

function writeAutoMap(map: Record<string, Array<[string, string]>>): void {
  fs.mkdirSync(path.dirname(AUTO_FILE), { recursive: true });
  fs.writeFileSync(AUTO_FILE, JSON.stringify(map, null, 2) + "\n", "utf8");
}

export function collectAutoCandidates(): Array<{ file: string; items: Array<{ old: string; display: string }> }> {
  const files = enumeratePluginFiles();
  const staticOlds = new Set(ALL_HANHUA_PAIRS.map(([old]) => old));
  const autoMap = readAutoMap();
  const autoOlds = new Set(Object.values(autoMap).flat().map(([old]) => old));
  const results: Array<{ file: string; items: Array<{ old: string; display: string }> }> = [];
  for (const file of files) {
    let src;
    try { src = fs.readFileSync(file, "utf8"); } catch { continue; }
    const items = extractAutoCandidates(src).filter((c) => !staticOlds.has(c.old) && !autoOlds.has(c.old));
    if (items.length > 0) results.push({ file, items });
  }
  return results;
}

export function applyAutoPatches(): PatchResult {
  const auto = readAutoMap();
  const result = emptyResult();
  result.skipped = false;
  for (const [file, pairs] of Object.entries(auto)) {
    if (!fs.existsSync(file)) continue;
    const r = applyToFile(file, pairs);
    if (r.error) result.errors.push(r.error);
    if (r.hits > 0) { result.appliedFiles++; result.appliedCount += r.hits; }
  }
  return result;
}

export function applyAutoPairs(file: string, pairs: Array<[string, string]>): { hits: number; error?: string } {
  return applyToFile(file, pairs);
}

export function saveAutoPairs(file: string, pairs: Array<[string, string]>): void {
  const auto = readAutoMap();
  const existing = auto[file] ?? [];
  const oldSet = new Set(existing.map(([old]) => old));
  auto[file] = [...existing, ...pairs.filter(([old]) => !oldSet.has(old))];
  writeAutoMap(auto);
}
