/**
 * 界面文本汉化补丁模块（patches.ts）
 *
 * 把 Pi 主程序 + 各插件 TUI 界面中的"说明文字与界面提示"翻译成中文。
 * 目标（动态定位，升级后自动恢复）：
 *   - Pi 主程序：bundle 主 chunk（含所有交互界面文本）
 *   - pi-plan-mode：菜单 chunk + dist/index.ts 状态/通知
 *   - pi-tui-kit：底部导航提示（navigate/select/close/back）
 *   - pi-web-access：Gemini 提示
 * 只改纯显示文本；label/逻辑值/命令名一律不动；备份 .bak.<包版本>、语法校验、幂等。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { stripTypeScriptTypes } from "node:module";
import { homedir } from "node:os";
import { PLAN_MODE_UI_MAP, PLAN_MODE_STATUS_MAP, TUI_KIT_MAP } from "./plan-cn-data.ts";
import { GOAL_X_MAPS, GOAL_X_PAIR_COUNT } from "./goalx-cn-data.ts";
import { BTW_MAP } from "./btw-cn-data.ts";
import { readLocaleMaps, isExportedMember } from "./locale-pack.ts";
import { UI_CN_MAP, UI_FRAG_MAP } from "./pi-ui-cn-data.ts";

// ---------- 映射 ----------
const MAIN_MAP: Array<[string, string]> = [["Maximum idle gap while waiting for HTTP headers or body chunks. Disable for local models that pause longer than five minutes.","Maximum idle gap while waiting for HTTP headers or body chunks. Disable for local models that pause longer than five minutes.（等待 HTTP 头或响应体的最大空闲时间。本地模型停顿超过五分钟时可关闭。）"],["Enter while streaming queues steering messages. 'one-at-a-time': deliver one, wait for response. 'all': deliver all at once.","Enter while streaming queues steering messages. 'one-at-a-time': deliver one, wait for response. 'all': deliver all at once.（输入时按回车会排队转向消息。'one-at-a-time'：一次发送一条并等待响应。'all'：一次性全部发送。）"],["Could not refresh ${result.errors.size} model catalogs (${[...result.errors.keys()].join(\", \")}); showing cached models.","Could not refresh ${result.errors.size} model catalogs (${[...result.errors.keys()].join(\", \")}); showing cached models.（无法刷新 ${result.errors.size} 个模型目录（${[...result.errors.keys()].join(\", \")}）；显示缓存的模型。）"],["Override the default thinking level for specific models. ${cycleThinkingKey} cycles in-session.","Override the default thinking level for specific models. ${cycleThinkingKey} cycles in-session.（为特定模型覆盖默认思考级别。${cycleThinkingKey} 在会话内循环切换。）"],["Could not refresh model catalogs: ${error instanceof Error?error.message:String(error)}","Could not refresh model catalogs: ${error instanceof Error?error.message:String(error)}（无法刷新模型目录：${error instanceof Error ? error.message : String(error)}）"],["  No named sessions in current folder. Press ${toggleKey} to show all, or Tab to view all.","  No named sessions in current folder. Press ${toggleKey} to show all, or Tab to view all.（当前文件夹没有已命名的会话。按 ${toggleKey} 显示全部，或按 Tab 查看全部。）"],["Saved decision: ${formatDecision(this.trustOptions[0]?.savedPath,options.savedDecision)}","Saved decision: ${formatDecision(this.trustOptions[0]?.savedPath,options.savedDecision)}（已保存的决定：${formatDecision(this.trustOptions[0]?.savedPath, options.savedDecision)}）"],["Fallback behavior when no extension or saved trust decision decides project trust","Fallback behavior when no extension or saved trust decision decides project trust（当没有扩展或已保存的信任决定时，项目信任的回退行为）"],["Print the transcript or only a session resume hint when exiting fullscreen mode","Print the transcript or only a session resume hint when exiting fullscreen mode（退出全屏模式时输出完整记录或仅输出会话恢复提示）"],["Could not refresh ${result.errors.keys().next().value}; showing cached models.","Could not refresh ${result.errors.keys().next().value}; showing cached models.（无法刷新 ${result.errors.keys().next().value}；显示缓存的模型。）"],["Only showing models from configured providers. Use /login to add providers.","Only showing models from configured providers. Use /login to add providers.（仅显示已配置提供商的模型。使用 /login 添加提供商。）"],["Send an anonymous version/update ping after changelog-detected updates","Send an anonymous version/update ping after changelog-detected updates（检测到更新后发送匿名版本/更新回执）"],["Horizontal padding for user messages, assistant messages, and thinking","Horizontal padding for user messages, assistant messages, and thinking（用户消息、助手消息和思考的水平内边距）"],["Scrollbar behavior in fullscreen mode; has no effect in regular mode","Scrollbar behavior in fullscreen mode; has no effect in regular mode（全屏模式下的滚动条行为；普通模式下无效）"],["Current session: ${options.projectTrusted?\"trusted\":\"untrusted\"}","Current session: ${options.projectTrusted?\"trusted\":\"untrusted\"}（当前会话：${options.projectTrusted ? \"已信任\" : \"未信任\"}）"],["No matching package found for ${source}. Did you mean ${suggestion}?","No matching package found for ${source}. Did you mean ${suggestion}?（未找到匹配 ${source} 的包。您是不是想找 ${suggestion}？）"],["Resize large images to 2000x2000 max for better model compatibility","Resize large images to 2000x2000 max for better model compatibility（将大图缩放至最大 2000x2000，以获得更好的模型兼容性）"],["Show the terminal cursor while still positioning it for IME support","Show the terminal cursor while still positioning it for IME support（显示终端光标（同时为 IME 支持定位））"],["Select a theme, or choose automatic to follow terminal appearance.","Select a theme, or choose automatic to follow terminal appearance.（选择主题，或选择 Automatic 跟随终端外观。）"],["Preferred transport for providers that support multiple transports","Preferred transport for providers that support multiple transports（为支持多种传输方式的提供商选择首选传输）"],["Project is not trusted; refusing to access project package storage","Project is not trusted; refusing to access project package storage（项目未受信任；拒绝访问项目包存储）"],["Refusing to use path outside package install root: ${resolvedPath}","Refusing to use path outside package install root: ${resolvedPath}（拒绝使用包安装根目录之外的路径：${resolvedPath}）"],["Warn when Anthropic subscription auth may use paid extra usage","Warn when Anthropic subscription auth may use paid extra usage（当 Anthropic 订阅认证可能产生付费额外用量时警告）"],["Select authentication method for ${providerOptions[0].name}:","Select authentication method for ${providerOptions[0].name}（为 ${providerOptions[0].name} 选择认证方式：）:"],["Thinking Level for ${m?modelDisplayLabel(m):ctx.model}","Thinking Level for ${m?modelDisplayLabel(m):ctx.model}（模型 ${m ? modelDisplayLabel(m) : ctx.model} 的思考级别）"],["Use separate themes for light and dark terminal appearance","Use separate themes for light and dark terminal appearance（为浅色和深色终端分别使用主题）"],["  No named sessions found. Press ${toggleKey} to show all.","  No named sessions found. Press ${toggleKey} to show all.（未找到已命名的会话。按 ${toggleKey} 显示全部。）"],["  Type to filter \\xB7 Enter to select \\xB7 Esc to go back","  Type to filter \\xB7 Enter to select \\xB7 Esc to go back（输入过滤 · 回车选择 · Esc 返回）"],["Theme to use in automatic mode when the terminal is light","Theme to use in automatic mode when the terminal is light（自动模式下终端为浅色时使用的主题）"],["Clear empty rows when content shrinks (may cause flicker)","Clear empty rows when content shrinks (may cause flicker)（内容缩小时清除空行（可能闪烁））"],["Theme to use in automatic mode when the terminal is dark","Theme to use in automatic mode when the terminal is dark（自动模式下终端为深色时使用的主题）"],["Show OSC 9;4 progress indicators in the terminal tab bar","Show OSC 9;4 progress indicators in the terminal tab bar（在终端标签栏显示 OSC 9;4 进度指示）"],["  No sessions in current folder. Press Tab to view all.","  No sessions in current folder. Press Tab to view all.（当前文件夹没有会话。按 Tab 查看全部。）"],["Choose themes for terminal light and dark appearance.","Choose themes for terminal light and dark appearance.（为终端浅色和深色外观选择主题。）"],["Select the theme to use for light terminal appearance","Select the theme to use for light terminal appearance（选择浅色终端外观使用的主题）"],["Select the theme to use for dark terminal appearance","Select the theme to use for dark terminal appearance（选择深色终端外观使用的主题）"],["Automatically compact context when it gets too large","Automatically compact context when it gets too large（上下文过大时自动压缩）"],["Action when pressing Escape twice with empty editor","Action when pressing Escape twice with empty editor（编辑器为空时连续按两次 Esc 的行为）"],["Revert to global default (${config.thinkingLevel})","Revert to global default (${config.thinkingLevel})（恢复为全局默认（${config.thinkingLevel}））"],["Log in to a provider or configure an API key first","Log in to a provider or configure an API key first（请先登录提供商或配置 API Key）"],["New version ${release2.version} is available. Run ","New version ${release2.version} is available. Run （新版本 ${release2.version} 可用。运行）"],["Max visible items in autocomplete dropdown (3-20)","Max visible items in autocomplete dropdown (3-20)（自动补全下拉框的最大可见项数（3-20））"],["\"Model refresh timed out; showing cached models.\"","\"Model refresh timed out; showing cached models.（模型刷新超时；显示缓存的模型。）\""],["Light/dark detection requires terminal support.","Light/dark detection requires terminal support.（浅色/深色检测需要终端支持。）"],["Prevent images from being sent to LLM providers","Prevent images from being sent to LLM providers（阻止图片发送给 LLM 提供商）"],["Render Mermaid code blocks as Unicode diagrams","Render Mermaid code blocks as Unicode diagrams（将 Mermaid 代码块渲染为 Unicode 图形）"],["Preferred inline image width in terminal cells","Preferred inline image width in terminal cells（终端中内联图片的优选宽度）"],["Select default thinking level for this model","Select default thinking level for this model（为此模型选择默认思考级别）"],["trash: ${parts.join(\" \\xB7 \").slice(0,200)}","trash: ${parts.join(\" \\xB7 \").slice(0,200)}（回收站：${parts.join(\" · \").slice(0, 200)}）"],["Hide thinking blocks in assistant responses","Hide thinking blocks in assistant responses（在助手回复中隐藏思考块）"],["${label} (inherited from ${decision.path})","${label} (inherited from ${decision.path})（${label}（继承自 ${decision.path}））"],["Cannot delete the currently active session","Cannot delete the currently active session（无法删除当前正在使用的会话）"],["Horizontal padding for input editor (0-3)","Horizontal padding for input editor (0-3)（输入编辑器的水平内边距（0-3））"],["${LEVEL_DESCRIPTIONS[level]} \\xB7 default","${LEVEL_DESCRIPTIONS[level]} · 默认"],["Register skills as /skill:name commands","Register skills as /skill:name commands（将技能注册为 /skill:name 命令）"],["`No matching package found for ${source}`","`No matching package found for ${source}（未找到匹配 ${source} 的包）`"],["Switch to one theme for light and dark","Switch to one theme for light and dark（切换为单一主题（不分深浅色））"],["Show condensed changelog after updates","Show condensed changelog after updates（更新后显示简短的更新日志）"],["  Enter to select \\xB7 Esc to go back","  Enter to select \\xB7 Esc to go back（回车选择 · Esc 返回）"],["Enable or disable individual warnings","Enable or disable individual warnings（启用或禁用各项警告）"],["  Model Name: ${selected.model.name}","  Model Name: ${selected.model.name}（模型名称：${selected.model.name}）"],["Package updates are available. Run ","Package updates are available. Run （有可用的包更新。运行）"],["Disable verbose printing at startup","Disable verbose printing at startup（启动时关闭详细输出）"],["Failed to load sessions: ${message}","Failed to load sessions: ${message}（加载会话失败：${message}）"],["\"Extra-high reasoning (~32k tokens)\"","\"Extra-high reasoning (~32k tokens)（超深度推理（约 32k tokens））\""],["\"Very brief reasoning (~1k tokens)\"","\"Very brief reasoning (~1k tokens)（非常简短的推理（约 1k tokens））\""],["Default filter when opening /tree","Default filter when opening /tree（打开 /tree 时的默认过滤方式）"],["Failed to delete: ${errorMessage4}","Failed to delete: ${errorMessage4}（删除失败：${errorMessage4}）"],["Updating ${scope} npm packages...","Updating ${scope} npm packages...（正在更新 ${scope} 的 npm 包...）"],["Missing source: ${resolvedSource}","Missing source: ${resolvedSource}（缺少源：${resolvedSource}）"],["Render images inline in terminal","Render images inline in terminal（在终端中内联渲染图片）"],["Updating ${sources[0].source}...","Updating ${sources[0].source}...（正在更新 ${sources[0].source}...）"],["Path does not exist: ${resolved}","Path does not exist: ${resolved}（路径不存在：${resolved}）"],["${modelName} \\u2022 thinking off","${modelName} \\u2022 thinking off（${modelName} • 思考关闭）"],["\"Moderate reasoning (~8k tokens)\"","\"Moderate reasoning (~8k tokens)（中度推理（约 8k tokens））\""],["Resume Session (Current Folder)","Resume Session (Current Folder)（恢复会话（当前文件夹））"],["\"Refreshing model catalogs\\u2026\"","\"Refreshing model catalogs\\u2026（正在刷新模型目录…）\""],["Select authentication method:","Select authentication method（选择认证方式：）:"],["Color theme for the interface","Color theme for the interface（界面的颜色主题）"],["\"Light reasoning (~2k tokens)\"","\"Light reasoning (~2k tokens)（轻度推理（约 2k tokens））\""],["\"Deep reasoning (~16k tokens)\"","\"Deep reasoning (~16k tokens)（深度推理（约 16k tokens））\""],["No login methods available.","No login methods available.（没有可用的登录方式。）"],["Select a model to configure","Select a model to configure（选择要配置的模型）"],["${label} (${decision.path})","${label} (${decision.path})（${label}（${decision.path}））"],["Updating ${entry.source}...","Updating ${entry.source}...（正在更新 ${entry.source}...）"],["Warning: ${warningMessage}","Warning: ${warningMessage}（警告：${warningMessage}）"],["Refreshing ${sourceStr}...","Refreshing ${sourceStr}...（正在刷新 ${sourceStr}...）"],["Package Updates Available","Package Updates Available（有可用的包更新）"],["\"Model catalogs refreshed.\"","\"Model catalogs refreshed.（模型目录已刷新。）\""],["Per-Model Thinking Level","Per-Model Thinking Level（各模型思考级别）"],["Label (empty to remove):","Label (empty to remove)（标签（留空删除）：）:"],["Sign in with an account","Sign in with an account（使用账号登录）"],["Sign in with an API key","Sign in with an API key（使用 API Key 登录）"],["Installing ${source}...","Installing ${source}...（正在安装 ${source}...）"],["Session moved to trash","Session moved to trash（会话已移到回收站）"],["Removing ${source}...","Removing ${source}...（正在移除 ${source}...）"],["\"  No matching models\"","\"  No matching models（没有匹配的模型）\""],["Resume Session (All)","Resume Session (All)（恢复会话（全部））"],["\"No models available\"","\"No models available（没有可用模型）\""],["  No sessions found","  No sessions found（没有找到会话）"],["  No entries found","  No entries found（没有找到条目）"],["\"Maximum reasoning\"","\"Maximum reasoning（最大推理）\""],["Update Available","Update Available（有可用更新）"],["Save and go back","Save and go back（保存并返回）"],["(clear override)","(clear override)（（清除覆盖））"],["Delete session? ","Delete session? （删除会话？）"],["Automatic Theme","Automatic Theme（自动主题）"],["\"Type to search:\"","\"Type to search（输入搜索：）:\""],["Session deleted","Session deleted（会话已删除）"],["\"Thinking Level\"","\"Thinking Level（思考级别）\""],["  Session Tree","  Session Tree（会话树）"],["Rename Session","Rename Session（重命名会话）"],["\"Changelog: \"","\"Changelog: （更新日志：）\""],[" (all/scoped)"," (all/scoped)（（全部/限定））"],["Project trust","Project trust（项目信任）"],["\"Unknown error\"","\"Unknown error（未知错误）\""],[" \\xB7 default"," \\xB7 default（· 默认）"],["\"No reasoning\"","\"No reasoning（无推理）\""],["Packages:","Packages（包：）:"],["Scope: ","Scope（范围：）: "],[" (auto)"," (auto)（（自动））"],["Sort: ","Sort（排序：）: "],["\"Name: \"","\"Name（名称：）: \""]];

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
  GOAL_X_PAIR_COUNT +
  BTW_MAP.length +
  UI_CN_MAP.length +
  UI_FRAG_MAP.length +
  Object.values(WEB_ACCESS_MAP).reduce((n, p) => n + p.length, 0);

const MARKER_FILE = path.join(homedir(), ".pi", "agent", "pi-cn-patch.json");
interface PatchMarker { mapVersion: number; chunkFile?: string; piVersion?: string; }

// 备份文件判定：.bak 与 .bak.<包版本> 都算备份（版本化备份见 ensureBackup）
const BAK_RE = /\.bak($|\.)/;
// 汉化痕迹判定：文件里出现中文即视为已汉化（译文一律是「英文原文 + （中文注释）」）
const CJK_RE = /[\u4e00-\u9fff]/;

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
// 从 pi 进程自身的启动路径反推安装目录（最可靠，不假设安装位置）。
// 原理：pi 由 bin shim 启动 -> node <pkg>/dist/bundle/cli.js，
// 真实入口就在 process.argv 里，向上回溯即可定位 dist/。
// realpathSync 用于解掉 npm shim 与符号链接（argv 里常是链接路径）。
function findPiDistFromArgv(): string | undefined {
  const looksLikeDist = (d: string) =>
    fs.existsSync(path.join(d, "bundle", "cli.js")) && fs.existsSync(path.join(d, "core", "slash-commands.js"));
  for (const raw of process.argv ?? []) {
    if (typeof raw !== "string" || !raw) continue;
    let fp = raw;
    try { fp = fs.realpathSync(fp); } catch { /* 非文件路径，保持原值 */ }
    try { if (!fs.statSync(fp).isFile()) continue; } catch { continue; }
    const dir = path.dirname(fp);
    for (let up = 0; up <= 6; up++) {
      const root = path.resolve(dir, ...Array(up).fill(".."));
      const distDir = path.join(root, "dist");
      if (looksLikeDist(distDir)) return distDir;
      if (looksLikeDist(root)) return root;
    }
  }
  return undefined;
}

export function findPiDist(): string | undefined {
  // 0) 进程自身路径反推（覆盖任意 npm prefix / pnpm / bun / 自定义安装位置）
  const fromArgv = findPiDistFromArgv();
  if (fromArgv) return fromArgv;

  const home = homedir();
  const candidates: string[] = [];
  // 用户显式配置优先
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(home, ".pi", "agent", "pi-cn.json"), "utf8"));
    if (typeof cfg?.piDist === "string" && fs.existsSync(cfg.piDist)) candidates.push(cfg.piDist);
  } catch { /* 无自定义配置 */ }
  // Windows 全局 npm 安装位
  const appData = process.env.APPDATA;
  if (appData) candidates.push(path.join(appData, "npm", "node_modules", "@earendil-works", "pi-coding-agent", "dist"));
  // 常见全局安装位置
  candidates.push(
    path.join(home, ".bun", "install", "global", "node_modules", "@earendil-works", "pi-coding-agent", "dist"),
    path.join(home, ".local", "lib", "node_modules", "@earendil-works", "pi-coding-agent", "dist"),
    "/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/dist",
    "/usr/lib/node_modules/@earendil-works/pi-coding-agent/dist",
  );
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "bundle", "cli.js"))) return c;
  }
  return undefined;
}

// 从 pi 的入口运行时声明解析主 chunk 文件名。
// cli-runtime.js 里写着 `import{APP_NAME,...,main}from"./chunks/chunk-XXXX.js"`，
// 这是 pi 自己的入口声明，最权威且不受汉化影响。
// （原实现靠英文标记 "No reasoning" 遍历定位，一旦汉化标记就消失，重启后即失效）
function findMainChunkFromRuntime(dist: string): string | undefined {
  const runtime = path.join(dist, "bundle", "cli-runtime.js");
  if (!fs.existsSync(runtime)) return undefined;
  let rt: string;
  try { rt = fs.readFileSync(runtime, "utf8"); } catch { return undefined; }
  const pick = (re: RegExp): string | undefined => {
    for (const m of rt.matchAll(re)) {
      const p = path.join(dist, "bundle", "chunks", m[1]);
      if (fs.existsSync(p)) return p;
    }
    return undefined;
  };
  return (
    pick(/import\{[^}]*\bmain\b[^}]*\}from"\.\/chunks\/([^"]+\.js)"/g) ??
    pick(/from"\.\/chunks\/([^"]+\.js)"/g)
  );
}

function findMainChunk(dist: string): string | undefined {
  const chunksDir = path.join(dist, "bundle", "chunks");
  if (!fs.existsSync(chunksDir)) return undefined;

  // 1) 权威：从入口运行时声明解析（不受汉化影响）
  const fromRuntime = findMainChunkFromRuntime(dist);
  if (fromRuntime) return fromRuntime;

  // 2) 上次记录的位置
  const marker = readMarker();
  if (marker?.chunkFile) {
    const cached = path.join(chunksDir, marker.chunkFile);
    if (fs.existsSync(cached)) return cached;
  }

  // 3) 英文标记（仅未汉化时有效）
  for (const f of fs.readdirSync(chunksDir)) {
    if (!f.endsWith(".js") || BAK_RE.test(f)) continue;
    const p = path.join(chunksDir, f);
    try {
      if (fs.readFileSync(p, "utf8").includes("No reasoning")) return p;
    } catch { /* 跳过 */ }
  }

  // 4) 兑底：主 chunk 远大于其他 chunk（数 MB vs 数 KB），取最大者
  let biggest: { p: string; size: number } | undefined;
  for (const f of fs.readdirSync(chunksDir)) {
    if (!f.endsWith(".js") || BAK_RE.test(f)) continue;
    const p = path.join(chunksDir, f);
    try {
      const size = fs.statSync(p).size;
      if (size > 1024 * 1024 && (!biggest || size > biggest.size)) biggest = { p, size };
    } catch { /* 跳过 */ }
  }
  return biggest?.p;
}

export function findWebAccessDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "pi-web-access");
  return fs.existsSync(path.join(p, "index.ts")) ? p : undefined;
}

function findPlanModeDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-plan-mode");
  return fs.existsSync(path.join(p, "dist")) ? p : undefined;
}

// 在 chunks 目录里按标记文本定位模块。
// 同时支持编译产物 .js 与源码直载 .ts：新一批 pi 插件（如 pi-plan-mode）
// 已从 dist/chunks/*.js 改为 dist/chunks/*.ts 直接被 pi 加载。
function findChunkByMarker(chunksDir: string, marker: string): string | undefined {
  if (!fs.existsSync(chunksDir)) return undefined;
  for (const f of fs.readdirSync(chunksDir)) {
    if (BAK_RE.test(f) || f.endsWith(".map")) continue;
    if (!f.endsWith(".js") && !f.endsWith(".ts")) continue;
    const p = path.join(chunksDir, f);
    try {
      if (fs.readFileSync(p, "utf8").includes(marker)) return p;
    } catch { /* 跳过 */ }
  }
  return undefined;
}

function findPlanUiChunk(dir: string): string | undefined {
  return findChunkByMarker(path.join(dir, "dist", "chunks"), "Start Plan mode");
}

function findTuiKitRendering(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "@narumitw", "pi-tui-kit", "dist", "components", "rendering.js");
  return fs.existsSync(p) ? p : undefined;
}

function findGoalXDir(): string | undefined {
  const p = path.join(homedir(), ".pi", "agent", "npm", "node_modules", "pi-goal-x", "extensions");
  return fs.existsSync(p) ? p : undefined;
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

// 语法校验（在写盘前做，失败则完全不动原文件）。
// 为何不用 node --check 检查 .ts：实测对「含 export 的 ESM .ts」会漏检——
// 同一段非法代码放进不含 export 的 .ts 会报错，加上 export 却退出码 0，
// 导致替换产生的语法错误被静默放行（pi-btw 的 `isAssistant（助手）Message` 就是这样漏出去的）。
// .ts 改用 Node 自带的 TS 解析器（stripTypeScriptTypes），它对类型语法宽容、对真语法错误报错。
function syntaxCheck(file: string, src: string): string | undefined {
  if (file.endsWith(".ts") || file.endsWith(".mts") || file.endsWith(".cts")) {
    try {
      stripTypeScriptTypes(src);
      return undefined;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // strip-only 模式不支持 enum / 参数属性等需代码生成的 TS 特性——
      // 这是 strip 的能力边界，不是语法错误，必须放行（否则合法文件会被误杀、汉化静默丢失）。
      if (/not supported in strip-only mode/i.test(msg)) return undefined;
      return msg;
    }
  }
  // .js 不能用 .js 后缀校验：Node 把它当 CommonJS 解析，
  // 含 export 的 ESM 代码会因「解析模式不匹配」反而退回退出码 0（实测漏检）。
  // 所以两种后缀都试，只要有一种能给出确定结论即返回。
  const results: string[] = [];
  for (const ext of [".mjs", ".cjs"]) {
    const tmp = file + ".pi-cn-check" + ext;
    try {
      fs.writeFileSync(tmp, src, "utf8");
      execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
      return undefined; // 任一种解析方式通过即视为语法合法
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(msg.split("\n").slice(0, 3).join(" ").slice(0, 140));
    } finally {
      try { fs.unlinkSync(tmp); } catch { /* 忽略 */ }
    }
  }
  // 两种都失败才判定为语法错误（取第一条信息）
  return results[0] ?? "语法校验失败";
}

// ---------- 备份：文件名带包版本 ----------
// 为什么带版本：备份只在「当前版本还没有备份」时创建，而 pi 原地覆盖升级后旧 .bak 会残留，
// 新版本文件就会“看起来已备份”，还原时把旧版本代码写回新版本 → 文件损坏。
// 带上安装版本的包版本号后，升级必然重新备份，且还原只认当前版本的备份。
function safeRead(p: string): string {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
}

// 从文件路径向上找最近的 package.json，取它的版本号（pi 主程序即 pi 的版本）
function packageVersionOf(file: string): string | undefined {
  let dir = path.dirname(path.resolve(file));
  for (let up = 0; up <= 6; up++) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
      if (typeof pkg?.version === "string" && pkg.version) return pkg.version;
    } catch { /* 这一层没有 package.json，继续向上 */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

// 当前安装版本对应的备份路径，例如 chunk-XXX.js.bak.1.0.0
export function backupPathFor(file: string): string {
  return file + ".bak." + (packageVersionOf(file) ?? "unknown");
}

// 体检等只读场景：优先当前版本备份，回退旧式 .bak（不用于还原，只用于比对原文）
export function existingBackupFor(file: string): string | undefined {
  const versioned = backupPathFor(file);
  if (fs.existsSync(versioned)) return versioned;
  const legacy = file + ".bak";
  return fs.existsSync(legacy) ? legacy : undefined;
}

// 列出同一目标文件的所有备份（含旧版本残留），用于还原后统计提示
function listBackups(file: string): string[] {
  const dir = path.dirname(file);
  const base = path.basename(file);
  try {
    return fs.readdirSync(dir)
      .filter((f) => f === base + ".bak" || f.startsWith(base + ".bak."))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

// 旧备份是否就是当前文件的“上一版”（同源）？
// 汉化只在原文里插入「（中文注释）」，所以同源备份的各个片段都能在当前文件里按序找到。
// 为什么不能只看「当前文件含中文」：pi-goal-x 这类源码本身就带中文注释，那个特征失效。
function isSameSource(current: string, legacy: string): boolean {
  if (!legacy || legacy.length < 64) return false;
  // 当前文件比备份还短：不可能只是“在备份上加了注释”
  if (current.length < legacy.length * 0.98) return false;
  const SEGMENTS = 20;
  const step = Math.max(1, Math.floor(legacy.length / SEGMENTS));
  let from = 0;
  let hit = 0;
  let tried = 0;
  for (let i = 0; i < SEGMENTS; i++) {
    const seg = legacy.slice(i * step, i * step + Math.min(step, 400));
    if (!seg) break;
    tried++;
    const at = current.indexOf(seg, from);
    if (at >= 0) { hit++; from = at + seg.length; }
  }
  return tried > 0 && hit / tried >= 0.8;
}

// 把旧式 .bak 迁移成「当前版本」的备份（.bak.<版本>）。
// 单独抽出来的原因：某文件本次没有新条目可应用时 applyToFile 会直接返回，
// 但它的旧备份仍需迁移，否则 /汉化 清除 会因「找不到当前版本的备份」而跳过它。
function migrateLegacyBackup(file: string, src?: string): boolean {
  const target = backupPathFor(file);
  if (fs.existsSync(target)) return false;
  const legacy = file + ".bak";
  if (!fs.existsSync(legacy)) return false;
  const current = src ?? safeRead(file);
  const legacyText = safeRead(legacy);
  // a) 强判定：当前文件已含中文、旧备份是纯英文
  // b) 弱判定：旧备份的片段基本都能在当前文件里按序找到（整文件本来就带中文注释的源码）
  const strong = CJK_RE.test(current) && !CJK_RE.test(legacyText);
  if (!strong && !isSameSource(current, legacyText)) return false;
  try { fs.renameSync(legacy, target); return true; } catch { return false; }
}

// 写盘前确保「当前安装版本」的原文备份存在。
// src 是替换前的内容：只有它不含中文时才当作原文备份，绝不把已汉化的内容存成“原文”。
function ensureBackup(file: string, src: string): void {
  const target = backupPathFor(file);
  if (fs.existsSync(target)) return; // 本版本已备份，不动

  const legacy = file + ".bak";
  if (fs.existsSync(legacy)) {
    // 1) 内容特征判定优先：当前文件已汉化、旧备份纯英文 → 就是它的原文备份
    if (migrateLegacyBackup(file, src)) return;
    // 2) marker 判定：marker 记的正是当前版本，或旧 marker 的 chunkFile 就是这个文件
    const marker = readMarker();
    const version = packageVersionOf(file) ?? "unknown";
    const sameVersion = marker?.piVersion === version;
    const sameFile = !marker?.piVersion && marker?.chunkFile === path.basename(file);
    if (sameVersion || sameFile) {
      try { fs.renameSync(legacy, target); return; } catch { /* 迁移失败则退回新建备份 */ }
    }
    // 3) 都不是：legacy 属于别的版本 → 改名归档（不删用户数据）
    const archived = file + ".bak." + (marker?.piVersion ?? "legacy");
    if (!fs.existsSync(archived)) {
      try { fs.renameSync(legacy, archived); } catch { /* 归档失败就原样留着 */ }
    }
  }
  // 未汉化的原文才值得备份（磁盘上的 p 此刻还是替换前的内容）
  if (!CJK_RE.test(src)) fs.copyFileSync(file, target);
}

function applyToFile(p: string, pairs: Array<[string, string]>): { hits: number; error?: string } {
  let src = fs.readFileSync(p, "utf8");
  let hits = 0;
  // 长 key 优先：避免短 key 命中长 key 的前缀。
  // 例："Unknown error" 会把 "Unknown error occurred" 误伤成 "未知错误 occurred"。
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  // 用占位符隔离：先全部换成不会被任何 key 命中的标记，最后再回填。
  // 否则短 key 会命中长 key 刚写入的译文："Thinking Level for " 替换后，
  // "Thinking Level" 又命中其中的 "Thinking Level"，得到
  // "Thinking Level（思考级别） for（思考级别）" 这种双重嵌套。
  const slots: string[] = [];
  const before = src; // 初始内容，用于幂等判定
  for (const [old, nw] of sorted) {
    // 幂等保护：若 new 已存在于「初始文件」则跳过，避免重复叠加。
    // 必须用 before 而不是 src：同一文件内多条映射可能相互包含，
    // 例如长条目刚写入 "Could not refresh（无法刷新） "，
    // 短条目 "Could not refresh " 检查中间态 src 就会误以为已汉化而跳过。
    if (src.includes(old) && !before.includes(nw)) {
      const ph = "\u0000" + slots.length + "\u0000";
      src = src.split(old).join(ph);
      slots.push(nw);
      hits++;
    }
  }
  if (slots.length > 0) src = src.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[Number(i)]);
  if (hits === 0) return { hits: 0 };

  // 先校验后写盘：失败时文件根本没被碰过，无需回滚
  const err = syntaxCheck(p, src);
  if (err) {
    return { hits: 0, error: path.basename(p) + " 语法校验失败，已放弃：" + err };
  }

  ensureBackup(p, before);
  fs.writeFileSync(p, src, "utf8");
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
  const r = applyToFile(chunk, [...MAIN_MAP, ...UI_CN_MAP, ...UI_FRAG_MAP]);
  if (r.error) result.errors.push(r.error);
  if (r.hits > 0) { result.appliedFiles = 1; result.appliedCount = r.hits; }
  writeMarker({ mapVersion: MAP_VERSION, chunkFile: path.basename(chunk), piVersion: packageVersionOf(chunk) });
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

// pi-goal-x：TS 源码直接加载，逐文件应用映射（node --check 可校验可擦除语法的 TS）
export function applyGoalXPatches(): PatchResult {
  const dir = findGoalXDir();
  if (!dir) {
    const missing = emptyResult();
    missing.missingFiles.push("pi-goal-x");
    return missing;
  }
  const result = emptyResult();
  result.skipped = false;
  for (const [file, pairs] of Object.entries(GOAL_X_MAPS)) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) { result.missingFiles.push(file); continue; }
    const r = applyToFile(p, pairs);
    if (r.error) result.errors.push(r.error);
    if (r.hits > 0) { result.appliedFiles++; result.appliedCount += r.hits; }
  }
  return result;
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
  btw: PatchResult;
  auto: PatchResult;
  locale: PatchResult;
} {
  const dist = findPiDist();
  const result = {
    pi: dist ? applyPatches(dist) : emptyResult(),
    webAccess: applyWebAccessPatches(),
    planMode: applyPlanModePatches(),
    tuiKit: applyTuiKitPatches(),
    goalX: applyGoalXPatches(),
    btw: applyBtwPatches(),
    auto: applyAutoPatches(),
    locale: applyLocalePatches(),
  };
  // 本次没有新条目可应用的目标（applyToFile 在 hits=0 时不碰文件），
  // 其旧式 .bak 仍要迁移成当前版本的备份，否则 /汉化 清除 会因找不到匹配备份而跳过。
  for (const t of collectTargets()) migrateLegacyBackup(t.file);
  return result;
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
      backup: fs.existsSync(backupPathFor(p)),
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
  const btwDir = findBtwDir();
  if (btwDir) push("pi-btw", path.join(btwDir, "dist", "index.ts"), "Pi 侧线程");
  const goalXDir = findGoalXDir();
  if (goalXDir) {
    for (const file of Object.keys(GOAL_X_MAPS)) {
      const p = path.join(goalXDir, file);
      if (!fs.existsSync(p)) continue;
      // 该文件内任意一条映射已命中（含中文注释）即视为已汉化
      const hanhua = GOAL_X_MAPS[file].some(([, nw]) => fs.readFileSync(p, "utf8").includes(nw));
      list.push({ target: "pi-goal-x " + file, file, hanhua, backup: fs.existsSync(backupPathFor(p)) });
    }
  }
  return list;
}

const ALL_HANHUA_PAIRS: Array<[string, string]> = [
  ...MAIN_MAP,
  ...UI_CN_MAP,
  ...UI_FRAG_MAP,
  ...PLAN_MODE_UI_MAP, ...PLAN_MODE_STATUS_MAP, ...TUI_KIT_MAP,
  ...Object.values(GOAL_X_MAPS).flat(),
  ...BTW_MAP,
  ...Object.values(WEB_ACCESS_MAP).flat(),
];

// ---------- 自动汉化：白名单上下文提取 + 动态映射 ----------
// 只提取明确“界面位置”（label/title/hint/placeholder/ui.*）里的英文文本，
// 天然避开给 AI 的 prompt 与工具定义（它们不经过这些界面 API）。
type AutoContextPattern = {
  re: RegExp;
  /**
   * 允许「单个词」候选时的形态限制：
   *   "capital" —— 仅首字母大写（label/title 的条目名，如 "Warnings"、"Tools"）
   *   "any"     —— 不限大小写（currentValue 的当前值，如 "configure"）
   * 未设置 —— 只收含空格的候选，用来避开逻辑值/枚举值（values:["default","none"]）。
   * 单词候选一律只在 pi 本体生效：插件的 label 里混着设置键名
   * （label:"autoSelectSingleGoal"）与枚举值（label:"OpenAI"），汉化会破坏读写。
   */
  single?: "capital" | "any";
  /** 插件侧也适用本条，并且允许单词候选（见 CLASS_FIELD_PATTERNS） */
  inPlugin?: boolean;
};

const AUTO_CONTEXT_PATTERNS: AutoContextPattern[] = [
  { re: /label:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`)/g, single: "capital" },
  { re: /title:\s*("(?:\\.|[^"\\])*")/g, single: "capital" },
  { re: /placeholder:\s*("(?:\\.|[^"\\])*")/g, single: "capital" },
  { re: /ui\.notify\(\s*("(?:\\.|[^"\\])*")/g },
  { re: /ui\.confirm\(\s*("(?:\\.|[^"\\])*")/g },
  { re: /ui\.editor\(\s*("(?:\\.|[^"\\])*")/g },
  { re: /ui\.input\(\s*("(?:\\.|[^"\\])*")/g },
  { re: /ui\.select\(\s*("(?:\\.|[^"\\])*")/g },
  { re: /notifyTerminal\(\s*ctx\.ui,\s*("(?:\\.|[^"\\])*")/g },
];

// 仅 pi 本体追加的规则：description / message / new Text / currentValue。
// 为什么只给 pi 本体用：本体里这几类绝大多数是设置项、键位说明、状态提示
// （实测能用 typebox / 遥测 schema 标记把其中的工具参数挑出去）；
// 而第三方插件的 description 绝大多数是工具参数说明（pi-fff、pi-goal-x、
// skill-tool 等），文本层面分不开——宁可漏译，也不能误译，
// 误译会直接改变模型看到的参数语义。
const AUTO_CONTEXT_PATTERNS_PI_ONLY: AutoContextPattern[] = [
  { re: /description:\s*("(?:\\.|[^"\\])*")/g },
  { re: /message:\s*("(?:\\.|[^"\\])*")/g },
  { re: /new Text\(\s*("(?:\\.|[^"\\])*")/g },
  // currentValue 是设置项的「当前值」显示文本（如 currentValue:"configure"），
  // 与 values:[...] 里的枚举值不同：后者参与匹配、绝不能动，前者只用于显示。
  { re: /currentValue:\s*("(?:\\.|[^"\\])*")/g, single: "any" },
];

// toggle: ["On", "Off"] —— 布尔型设置项的两个显示标签（设置界面里那个 Off）。
// 为什么安全：format() 返回 toggle[0]/toggle[1] 用于显示，setConfig() 又用
// `value === this.options.toggle[0]` 判断用户选中的是哪一项 —— 两边读的是同一个数组，
// 所以替换后仍然自洽。同族的 labels 对象同理（setConfig 用 invertLabels(labels) 反查）。
const TOGGLE_PATTERN = /\btoggle:\s*\[\s*("(?:\\.|[^"\\])*")\s*,\s*("(?:\\.|[^"\\])*")\s*\]/g;

/**
 * 「显示文本参数位置」白名单（方案 B）。
 *
 * 主白名单（label: / description: / ui.*）覆盖不到渲染 API 的裸字符串参数，例如：
 *     `${this.hint("tui.select.confirm", "save")} • ${this.hint("tui.select.cancel", "cancel")}`
 * "save" / "cancel" 是给人看的按键提示，但既不以 label: 开头，也不含空格，
 * 于是被两道规则同时挡在外面，永远扫不到。
 *
 * 这里的安全性来自「调用点」而不是字符串形态：下列 API 的指定参数只用于显示，
 * 不可能参与逻辑判断，所以这一轮**允许短词**。
 * 但短词额外加一道「同文件内必须唯一」的保护（见 extractAutoCandidates 第二轮）：
 * 同一个词在文件里多处出现时，无法区分哪一处是显示、哪一处是逻辑值，宁可漏译。
 *
 * 每条 pattern 的捕获组 1 必须是「显示文本」那个字符串字面量。
 */
const UI_CALL_PATTERNS: RegExp[] = [
  // hint(bindingId, text)：第二参数是显示文本，第一参数是键位 id（不能动）
  /\bhint\(\s*"[^"]*"\s*,\s*("(?:\\.|[^"\\])*")/g,
  // rawKeyHint(keyDisplay, text)：同上
  /\brawKeyHint\(\s*[^,]+?,\s*("(?:\\.|[^"\\])*")/g,
  // setWorkingMessage(text)：流式工作提示（"Working…"）
  /\bsetWorkingMessage\(\s*("(?:\\.|[^"\\])*")/g,
  // setHiddenThinkingLabel(text)：思考折叠块的标签
  /\bsetHiddenThinkingLabel\(\s*("(?:\\.|[^"\\])*")/g,
  // setStatus(statusId, text)：第二参数是显示文本，第一参数是状态槽标识（不能动）
  /\bsetStatus\(\s*[^,]+?,\s*("(?:\\.|[^"\\])*")/g,
  // setTitle(text)：标题
  /\bsetTitle\(\s*("(?:\\.|[^"\\])*")/g,
];

// 明显的代码残片（正则跨引号匹配时的副产物，不是文案）：
//   "),theme.fg(" / ";function makeX(...)" / "+memberName+"
const CODE_FRAGMENT = /=>|\bfunction\b|\btheme\.|^\s*[;)]|\)\s*,|^\s*\+|\+\s*$/;
// UI 文案极少超 160 字符，超过的基本是整段代码或模板残片。
const MAX_DISPLAY_LENGTH = 160;

const AUTO_FILE = path.join(homedir(), ".pi", "agent", "hanhua-auto.json");

// 判断一处字符串是否位于「给模型的工具/参数 schema」里，而不是给人看的界面位置。
//
// 标记是怎么定出来的（把主 chunk 的实际上下文拉出来看的）：
//   该译："app.clear":{defaultKeys:"ctrl+c",description:"Clear editor"}            ← 键位表
//   不该译：bashSchema=typebox_exports.Object({command:typebox_exports.String({description:"Bash command to execute"})})
//   不该译："pi.tool.call_id":{type:"string",required:!0,cardinality:"high",description:"Tool call id"}
// 也就是说，工具 schema 与遥测属性 schema 的 description 前后必定带着上述结构标记，
// 而界面文案旁边是 defaultKeys / label / title 这类 UI 字段——两者在文本层面可以分开。
// 为何必须排除：这类文本一旦加上中文，模型读到的参数说明就变了，会改变工具调用行为。
const TOOL_SCHEMA_MARKERS =
  /typebox_exports\.|inputSchema|input_schema|outputSchema|output_schema|jsonSchema|parameters\s*[:=]|properties\s*[:=]|\bz\.object\(|Type\.Object\(|type\s*:\s*["'](?:string|number|boolean|object|array)["']|required\s*:\s*!|cardinality\s*:/;
// 窗口取 300/400：标记在实测中都在 description 紧邻的几十字符内；
// 向后必须给足——工具对象的形状是 {name, label, description, inputSchema}，
// schema 标记在 label 之后，只看前文会把工具名 label（"bash"/"edit"）放进来。
const TOOL_SCHEMA_WINDOW_BACK = 300;
const TOOL_SCHEMA_WINDOW_FORWARD = 400;

// 命令行参数说明的文本特征。
// 插件（pi-fff、pi-goal-x 等）的工具参数常写成 CLI help 风格，且不在 typebox 结构里：
//   "Path to the frecency database (overrides FFF_FRECENCY_DB env)"
//   "-d, --db <path>  Path to ... (default true)"
// 这类文本同样是给模型看的，汉化会改变工具调用语义，必须一并排除。
const CLI_ARG_STYLE =
  /(^|[\s(])(-[a-zA-Z],\s*)?--[a-zA-Z][\w-]*|<[a-z][\w-]*>|\(default[^)]{0,40}\)|overrides?\s+[A-Z][A-Z0-9_]{2,}|_[A-Z]{2,}\b|\$[A-Z][A-Z0-9_]{2,}/;

/**
 * 类字段形态的界面文案：`readonly label = "Thresholds";`
 *
 * 为什么单独一组：
 *   1. 形态不同 —— 类字段用 `=` 而不是 `label:`，主白名单匹配不到，
 *      于是 pi-token-speed 设置页里的 Thresholds / Colors / Display colors 一直是英文；
 *   2. 允许单词候选 —— 插件的单词 label 平时一律不收（怕撞上设置键名
 *      label:"autoSelectSingleGoal" 与枚举值 label:"OpenAI"），
 *      但 `readonly label = "..."` 是「设置项 / UI 组件的显示名定义」，
 *      与枚举值（在对象字面量或数组里）形态可区分，所以这一组放行；
 *   3. 必须带 `readonly` —— 实测裸赋值里混着非界面用途的字串
 *      （`label=" b "` 宽度填充、`label="Google Account:[^"` 正则片段），
 *      只有加上 readonly 才能干净分开。
 */
const CLASS_FIELD_PATTERNS: AutoContextPattern[] = [
  { re: /readonly\s+label\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, single: "capital", inPlugin: true },
  { re: /readonly\s+title\s*=\s*("(?:\\.|[^"\\])*")/g, single: "capital", inPlugin: true },
  { re: /readonly\s+description\s*=\s*("(?:\\.|[^"\\])*")/g, inPlugin: true },
];

function looksLikeToolSchemaText(src: string, index: number): boolean {
  const from = Math.max(0, index - TOOL_SCHEMA_WINDOW_BACK);
  return TOOL_SCHEMA_MARKERS.test(src.slice(from, index + TOOL_SCHEMA_WINDOW_FORWARD));
}

function decodeEscapes(s: string): string {
  return s
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

/** 统计字面量在源码里出现的次数（用于短词的唯一性保护） */
function countIn(src: string, quoted: string): number {
  let n = 0;
  let i = -1;
  while ((i = src.indexOf(quoted, i + 1)) !== -1) n++;
  return n;
}

/**
 * 提取「标签对象」里的显示文案（方案 B2）。
 *
 * 插件把下拉框 / 枚举的显示名集中放在 Record 里：
 *     const DISPLAY_LABELS: Record<DisplayMode, string> = {
 *       tps: "TPS speed",
 *       full: "Full details",
 *     };
 * 这些值不是 label: / description:，主白名单扫不到，设置界面右侧那一列就一直是英文。
 *
 * 为什么敢收：key 才是逻辑值（"tps" / "full"），value 只用于显示。
 * 三道保护：
 *   ① 变量名必须以 _LABELS / _LABEL 结尾 —— 明确的「显示标签」命名约定
 *   ② value 必须与 key 文本不同（排除 {off:"off"} 这类 key/value 同形的逻辑值）
 *   ③ value 得「像文案」：含空格或首字母大写，且不是纯数字/单位（"50 ms"、"0 | 15"）
 */
function extractLabelObjectCandidates(src: string): Array<{ old: string; display: string }> {
  const out: Array<{ old: string; display: string }> = [];
  const declRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*_LABELS?)\s*(?::[^=;\n]*)?=\s*\{/g;
  let d: RegExpExecArray | null;
  while ((d = declRe.exec(src)) !== null) {
    const open = d.index + d[0].length - 1;
    // 从开括号配平找对象结束位置（带字符串感知，避免字符串里的括号干扰）
    let depth = 0;
    let end = -1;
    let inStr: string | undefined;
    for (let i = open; i < src.length; i++) {
      const ch = src[i];
      if (inStr) {
        if (ch === "\\") { i++; continue; }
        if (ch === inStr) inStr = undefined;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) continue;
    const body = src.slice(open + 1, end);
    const pairRe = /(?:^|[{,])\s*(?:(\d+)|([A-Za-z_$][\w$]*)|"([^"]*)"|'([^']*)')\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
    let p: RegExpExecArray | null;
    while ((p = pairRe.exec(body)) !== null) {
      const key = p[1] ?? p[2] ?? p[3] ?? p[4] ?? "";
      const quoted = p[5];
      const value = decodeEscapes(quoted.slice(1, -1));
      if (!value || /[\u4e00-\u9fff]/.test(value)) continue; // 空串 / 已汉化
      if (value === key) continue;                           // ② key/value 同形
      if (!/[A-Za-z]/.test(value)) continue;
      if (!/\s/.test(value) && !/^[A-Z]/.test(value)) continue; // ③ 不像文案
      if (/^[\d\s.,|/+-]+\s*(ms|s|%|k|m)?$/i.test(value)) continue; // 纯数字/单位
      out.push({ old: quoted, display: value });
    }
  }
  return out;
}

function extractAutoCandidates(src: string, piCore = false): Array<{ old: string; display: string }> {
  const out: Array<{ old: string; display: string }> = [];
  const seen = new Set<string>();
  const patterns = piCore
    ? [...AUTO_CONTEXT_PATTERNS, ...AUTO_CONTEXT_PATTERNS_PI_ONLY, ...CLASS_FIELD_PATTERNS]
    : [...AUTO_CONTEXT_PATTERNS, ...CLASS_FIELD_PATTERNS];
  for (const p of patterns) {
    const re = p.re;
    const single = p.single;
    // 单词候选的放行范围：pi 本体一律放行；插件侧只有显式标了 inPlugin 的那组（类字段形态）放行。
    const singleScope = piCore || p.inPlugin;
    let m;
    while ((m = re.exec(src))) {
      const quoted = m[1];
      const display = decodeEscapes(quoted.slice(1, -1));
      if (/[\u4e00-\u9fff]/.test(display)) continue; // 已汉化
      // 给模型的工具/参数说明不得汉化（加了中文会改变工具调用语义）
      if (looksLikeToolSchemaText(src, m.index)) continue;
      // 导出对象的成员可能既是显示文案又是逻辑校验值，不得汉化。
      // 实例：ROW_INTENT_META.other.label 既喂给 displayLabel() 显示，
      // 又被 RESERVED_LABEL_SET 拿去校验 —— 数据流跨对象与文件，纯文本体检看不见。
      if (isExportedMember(src, m.index + m[0].indexOf(m[1]))) continue;
      if (CLI_ARG_STYLE.test(display)) continue;
      if (CODE_FRAGMENT.test(display)) continue; // 正则跨引号匹配出的代码残片
      if (display.length > MAX_DISPLAY_LENGTH) continue;
      if (!/[A-Za-z]/.test(display)) continue;
      if (!/\s/.test(display)) {
        // 单词候选：只在放行范围内、且形态符合时才收。
        // 默认要求含空格，是为了避开逻辑值/枚举值（values:["default","none"]）。
        const mode = singleScope ? single : undefined;
        if (!mode) continue;
        if (mode === "capital" && !/^[A-Z]/.test(display)) continue;
      }
      if (display.includes("${")) continue; // 动态模板跳过
      if (seen.has(quoted)) continue;
      seen.add(quoted);
      out.push({ old: quoted, display });
    }
  }

  // 第二轮：渲染 API 的「显示文本参数位置」（方案 B）。
  // 与第一轮的区别：这一轮允许短词（不含空格的词，如 "save" / "cancel"）。
  // 依据见 UI_CALL_PATTERNS 的注释；短词另加「同文件内唯一」保护。
  for (const re of UI_CALL_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const quoted = m[1];
      const display = decodeEscapes(quoted.slice(1, -1));
      if (!display || /[\u4e00-\u9fff]/.test(display)) continue; // 空串 / 已汉化
      if (display.includes("${")) continue;
      if (!/[A-Za-z]/.test(display)) continue;
      if (display.length > MAX_DISPLAY_LENGTH) continue;
      if (CODE_FRAGMENT.test(display)) continue;
      if (CLI_ARG_STYLE.test(display)) continue;
      if (looksLikeToolSchemaText(src, m.index)) continue;
      if (isExportedMember(src, m.index + m[0].indexOf(quoted))) continue;
      // 短词（不含空格）必须在本文件内唯一：同词多处出现时无法区分
      // 哪一处是显示、哪一处是逻辑值，宁可漏译。
      if (!/\s/.test(display) && countIn(src, quoted) > 1) continue;
      if (seen.has(quoted)) continue;
      seen.add(quoted);
      out.push({ old: quoted, display });
    }
  }

  // 第二轮附：toggle: ["On", "Off"] 两个显示标签（都是短词，同样加唯一性保护）。
  TOGGLE_PATTERN.lastIndex = 0;
  let tg;
  while ((tg = TOGGLE_PATTERN.exec(src)) !== null) {
    for (const quoted of [tg[1], tg[2]]) {
      const display = decodeEscapes(quoted.slice(1, -1));
      if (!display || /[\u4e00-\u9fff]/.test(display)) continue;
      if (!/[A-Za-z]/.test(display)) continue;
      if (display.length > MAX_DISPLAY_LENGTH) continue;
      if (CODE_FRAGMENT.test(display)) continue;
      if (isExportedMember(src, tg.index + tg[0].indexOf(quoted))) continue;
      if (!/\s/.test(display) && countIn(src, quoted) > 1) continue;
      if (seen.has(quoted)) continue;
      seen.add(quoted);
      out.push({ old: quoted, display });
    }
  }

  // 第三轮：标签对象（方案 B2）—— `const X_LABELS: Record<K, string> = { k: "显示名" }`。
  // 设置界面右侧那一列（下拉框当前值）就来自这些 value。
  for (const c of extractLabelObjectCandidates(src)) {
    if (seen.has(c.old)) continue;
    if (looksLikeToolSchemaText(src, src.indexOf(c.old))) continue;
    seen.add(c.old);
    out.push(c);
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

// 自动汉化扫描：跳过无关目录，避免扫入插件依赖/构建产物
const AUTO_SKIP_DIRS = new Set(["node_modules", "test", "tests", "docs", "locales", ".git", ".pi", "scripts", "bundle", "vendor"]);

function isSourceFile(name: string): boolean {
  // .d.ts / .d.mts / .d.cts 是类型声明，不是可执行代码：
  // 汉化它既无用（运行时读的是 .js），又会让候选清单堆满一堆永远无法应用的条目。
  if (name.endsWith(".d.ts") || name.endsWith(".d.mts") || name.endsWith(".d.cts")) return false;
  if (!name.endsWith(".js") && !name.endsWith(".ts")) return false;
  if (BAK_RE.test(name) || name.endsWith(".map")) return false;
  if (name.includes(".bundle.") || name.includes(".min.")) return false;
  return true;
}

// 递归收集源码文件（跳过无关目录）
function walkSourceDir(dir: string, files: string[]): void {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (AUTO_SKIP_DIRS.has(e.name)) continue;
      walkSourceDir(p, files);
      continue;
    }
    if (isSourceFile(e.name)) files.push(p);
  }
}

// 收集单个插件的可汉化源码文件，以 package.json 声明的 pi.extensions 入口为中心：
// - 入口在 dist/ 内（编译产物模式，如 @narumitw 系列）→ 只扫 dist/，避免汉化到不被加载的 src/ 源码
// - 入口为源码（如 ./index.ts、./src/index.ts）→ 扫入口所在目录及 pkgDir/src，跟随真实 import 链
// - 无 pi.extensions 声明 → 兜底扫常见目录 + 包根目录
function collectEntryFiles(pkgDir: string, files: string[]): void {
  let entrySpecs: string[] = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    if (Array.isArray(pkg?.pi?.extensions)) {
      entrySpecs = pkg.pi.extensions.filter((r): r is string => typeof r === "string");
    }
  } catch { /* 无 package.json 或解析失败 */ }

  if (entrySpecs.length > 0) {
    for (const rel of entrySpecs) {
      const p = path.resolve(pkgDir, rel);
      if (!fs.existsSync(p)) continue;
      if (fs.statSync(p).isDirectory()) {
        walkSourceDir(p, files); // 目录入口（如 ./extensions）：整个目录
      } else if (isSourceFile(path.basename(p))) {
        files.push(p); // 入口文件本身
        const inDist = path.relative(pkgDir, p).split(path.sep)[0] === "dist";
        if (inDist) {
          walkSourceDir(path.join(pkgDir, "dist"), files); // 编译产物模式：只扫 dist
        } else {
          walkSourceDir(path.dirname(p), files); // 源码模式：入口所在目录（递归覆盖同目录及子目录模块）
          const srcDir = path.join(pkgDir, "src");
          if (path.resolve(srcDir) !== path.resolve(path.dirname(p)) && fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
            walkSourceDir(srcDir, files); // 入口在根目录但 import src/（如 pi-tool-display）
          }
        }
      }
    }
    return;
  }

  // 兜底：无 pi.extensions 声明 → 扫常见目录 + 包根目录
  for (const c of ["dist", "src", "extensions"]) {
    const p = path.join(pkgDir, c);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) walkSourceDir(p, files);
  }
  let entries;
  try { entries = fs.readdirSync(pkgDir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) continue;
    if (isSourceFile(e.name)) files.push(path.join(pkgDir, e.name));
  }
}

// 沙箱/协议运行时文件：里面的文案是给模型或协议看的（codemode 脚本的报错、worker 内部消息），
// 不是界面文案。这类文本没加中文的余地，加了反而让模型读到中文报错。整个文件不扫。
// execute-*.js 的文件名带哈希，每次发版都变，所以用模式而不是固定文件名。
const NON_UI_FILE = /^(codemode-worker|execute-[A-Z0-9]+)\.js$/i;

// pi 本体（安装目录）里值得自动汉化的文件。
// 为什么要单独收集：AUTO_SKIP_DIRS 把 bundle 排除在外（那是插件依赖/构建产物的常规规避），
// 而 pi 本体的界面代码恰好全在 dist/bundle/chunks 与 dist/core 下。之前完全不扫本体，
// 导致 /汉化 扫描 对本体的数百条界面文案永远 0 命中，只能靠手工表一条条补。
function collectPiDistFiles(): string[] {
  const dist = findPiDist();
  if (!dist) return [];
  const out: string[] = [];
  for (const sub of [["bundle", "chunks"], ["core"], ["tools"]]) {
    const root = path.join(dist, ...sub);
    if (!fs.existsSync(root)) continue;
    const walk = (d: string): void => {
      let entries;
      try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!isSourceFile(e.name)) continue;
        if (NON_UI_FILE.test(e.name)) continue;
        out.push(p);
      }
    };
    walk(root);
  }
  return out;
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
      if (path.basename(pkgDir) === "pi-cn") continue; // 排除自身
      const hasPkg = fs.existsSync(path.join(pkgDir, "package.json"));
      if (hasPkg && !isPiPlugin(pkgDir)) continue; // 有 package.json 但非 pi 插件（依赖）跳过
      collectEntryFiles(pkgDir, files);
    }
  }
  // 去重（入口文件可能被目录递归重复收集）；并把 pi 本体并入扫描目标
  return [...new Set([...files, ...collectPiDistFiles()])];
}

export function readAutoMap(): Record<string, Array<[string, string]>> {
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

/** 路径归一化：用于把映射表的 key 与扫描到的文件路径对上（大小写/斜杠差异） */
function normPathKey(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

export function collectAutoCandidates(): Array<{ file: string; items: Array<{ old: string; display: string }> }> {
  const files = enumeratePluginFiles();
  const staticOlds = new Set(ALL_HANHUA_PAIRS.map(([old]) => old));
  const autoMap = readAutoMap();
  // 按「文件」建已记录集合，而不是用一个全局集合。
  //
  // 原来用全局集合时只有先扫到的那个文件会被记录，其余文件永远得不到替换：
  //   "Display mode" 既在 pi-token-speed/src/commands.ts 的命令说明里，
  //   也在 src/settings/items/display.ts 的 label 里；
  //   先扫到 commands.ts 并记录后，display.ts 的那份就被过滤掉了，
  //   于是设置界面里这一项永远是英文。
  const autoOldsByFile = new Map<string, Set<string>>();
  for (const [f, pairs] of Object.entries(autoMap)) {
    autoOldsByFile.set(normPathKey(f), new Set(pairs.map(([old]) => old)));
  }
  // 语言包已覆盖的英文不进模型翻译队列：作者已经给了官方中文，重复翻译既费 token 又可能译法不一致。
  // 这条是全局生效的（与文件无关），因为语言包本身就是全插件的方案。
  const localeOlds = new Set(Object.values(readLocaleMaps()).flat().map(([old]) => old));
  const results: Array<{ file: string; items: Array<{ old: string; display: string }> }> = [];
  // pi 本体路径只算一次：findPiDist 会遍历 argv 与若干候选目录，放进循环里会明显变慢。
  const dist = findPiDist();
  const distKey = dist ? path.resolve(dist).toLowerCase() : undefined;
  for (const file of files) {
    let src;
    try { src = fs.readFileSync(file, "utf8"); } catch { continue; }
    const piCore = !!distKey && path.resolve(file).toLowerCase().startsWith(distKey);
    const seenHere = autoOldsByFile.get(normPathKey(file));
    const items = extractAutoCandidates(src, piCore).filter(
      (c) => !staticOlds.has(c.old) && !localeOlds.has(c.old) && !seenHere?.has(c.old),
    );
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

// 语言包映射（插件作者官方的中文，零 token）。
// 与自动汉化分开存放（pi-cn-locale.json）：来源不同，追溯和清除都要能分开。
// 两者用同一套 applyToFile（备份 / 语法校验 / 幂等 / 长 key 优先），所以安全性一致。
export function applyLocalePatches(): PatchResult {
  const locale = readLocaleMaps();
  const result = emptyResult();
  result.skipped = false;
  for (const [file, pairs] of Object.entries(locale)) {
    if (!fs.existsSync(file)) continue;
    const r = applyToFile(file, pairs);
    if (r.error) result.errors.push(r.error);
    if (r.hits > 0) { result.appliedFiles++; result.appliedCount += r.hits; }
  }
  return result;
}

export function saveAutoPairs(file: string, pairs: Array<[string, string]>): void {
  const auto = readAutoMap();
  const existing = auto[file] ?? [];
  const oldSet = new Set(existing.map(([old]) => old));
  auto[file] = [...existing, ...pairs.filter(([old]) => !oldSet.has(old))];
  writeAutoMap(auto);
}

// ---------- 统一目标清单（体检 / 还原 / 状态共用一套定位） ----------
// 为什么需要：原先每个 apply*Patches 各自定位文件，体检和还原需要重复一遍，
// 一旦漏掉某个目标就会出现「汉化了但还原不掉」的幽灵文件。
export interface PatchTarget {
  label: string;
  file: string;
  pairs: Array<[string, string]>;
}

// 把文件路径转成易读的标签：包名 + 包内相对路径。
// 原实现只用 path.basename，导致清单里一堆分不清归属的 “index.ts”。
function targetLabel(file: string, fallback: string): string {
  const norm = file.replace(/\\/g, "/");
  const m = norm.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\/(.+)$/);
  if (m) return m[1] + "/" + m[2];
  const e = norm.match(/\/extensions\/(.+)$/);
  if (e) return e[1];
  return fallback;
}

export function collectTargets(): PatchTarget[] {
  // 按文件去重：同一文件可能同时被「手工表」和「自动汉化记录」覆盖，
  // 合并两者的映射，避免重复应用、重复体检、还原时重复计数。
  const byFile = new Map<string, PatchTarget>();
  const push = (label: string, p: string | undefined, pairs: Array<[string, string]>) => {
    if (!p || !fs.existsSync(p)) return;
    const key = p.replace(/\\/g, "/").toLowerCase();
    const prev = byFile.get(key);
    if (prev) {
      const known = new Set(prev.pairs.map(([k]) => k));
      for (const pair of pairs) if (!known.has(pair[0])) prev.pairs.push(pair);
      return;
    }
    byFile.set(key, { label: targetLabel(p, label), file: p, pairs: [...pairs] });
  };
  const dist = findPiDist();
  push("Pi 主程序", dist ? findMainChunk(dist) : undefined, [...MAIN_MAP, ...UI_CN_MAP, ...UI_FRAG_MAP]);
  push("pi-tui-kit", findTuiKitRendering(), TUI_KIT_MAP);
  const wa = findWebAccessDir();
  if (wa) for (const [rel, pairs] of Object.entries(WEB_ACCESS_MAP)) push("pi-web-access", path.join(wa, rel), pairs);
  const pm = findPlanModeDir();
  if (pm) {
    push("pi-plan-mode 菜单", findPlanUiChunk(pm), PLAN_MODE_UI_MAP);
    push("pi-plan-mode 状态", path.join(pm, "dist", "index.ts"), PLAN_MODE_STATUS_MAP);
  }
  const gx = findGoalXDir();
  if (gx) {
    for (const [rel, pairs] of Object.entries(GOAL_X_MAPS)) push("pi-goal-x " + rel, path.join(gx, rel), pairs);
  }
  const btw = findBtwDir();
  push("pi-btw", btw ? path.join(btw, "dist", "index.ts") : undefined, BTW_MAP);
  // 自动汉化记录过的文件
  for (const [f, pairs] of Object.entries(readAutoMap())) {
    push("自动汉化", f, pairs as Array<[string, string]>);
  }
  // 语言包映射（插件官方中文）
  for (const [f, pairs] of Object.entries(readLocaleMaps())) {
    push("语言包", f, pairs as Array<[string, string]>);
  }
  return [...byFile.values()];
}

// ---------- 还原：从版本化备份恢复原始英文 ----------
// 只认「当前安装版本」的备份：跨版本升级后旧备份与新文件不匹配，宁可不还原也不把旧代码写回新文件。
// 同时统计其它版本残留的备份数量（保留不删，交给用户自行处理）。
export function revertAllPatches(): { restored: number; files: string[]; skipped: number; stale: number } {
  let restored = 0;
  let skipped = 0;
  let stale = 0;
  const files: string[] = [];
  for (const { file } of collectTargets()) {
    const bak = backupPathFor(file);
    if (!fs.existsSync(bak)) { skipped++; continue; }
    try {
      fs.copyFileSync(bak, file);
      fs.unlinkSync(bak);
      restored++;
      files.push(path.basename(file));
    } catch { skipped++; }
    // 本版本备份已删除，剩下的都是其它版本的残留
    stale += listBackups(file).length;
  }
  try { fs.unlinkSync(MARKER_FILE); } catch { /* 无标记 */ }
  return { restored, files, skipped, stale };
}
