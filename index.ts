/**
 * Pi 中文汉化插件（pi-cn）
 *
 * 三合一：
 *  1. / 命令补全中文说明 + 使用频率排序（纯插件，零侵入）
 *  2. 界面文本自动汉化补丁（加载时检测并应用，备份 .bak、语法校验、幂等）
 *  3. 管理命令：/汉化（交互菜单：自动汉化/扫描/补充命令/界面管理）
 *
 * 原则：只改用户可见界面文字与补全提示；AI 可见内容与逻辑标识一律不动。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  buildProvider,
  setCurrentProvider,
  recordFromInput,
  flowTranslate,
  clearFrequency,
  readFrequency,
} from "./lib.ts";
import {
  findPiDist,
  applyAllPatches,
  allPatchStatus,
  collectAutoCandidates,
  applyAutoPairs,
  saveAutoPairs,
  type PatchResult,
} from "./patches.ts";

let piRef: ExtensionAPI | undefined;
let patchNotice: string | undefined;

// ---------- 汇总各目标补丁结果 ----------
function collectResults(all: ReturnType<typeof applyAllPatches>) {
  const rs = [
    all.pi,
    all.webAccess,
    all.planMode.ui,
    all.planMode.status,
    all.tuiKit,
    all.goal.menu,
    all.goal.settings,
    all.goal.core,
    all.goal.index,
    all.btw,
    all.auto,
  ];
  return {
    files: rs.reduce((n, r) => n + r.appliedFiles, 0),
    count: rs.reduce((n, r) => n + r.appliedCount, 0),
    errors: rs.flatMap((r) => r.errors),
    missing: rs.flatMap((r) => r.missingFiles),
  };
}

// ---------- /汉化 扫描：列出界面未汉化文本 ----------
async function flowScanInterface(ctx: any): Promise<void> {
  const miss = collectAutoCandidates();
  if (miss.length === 0) {
    ctx.ui.notify("✅ 未发现漏网的英文界面文本（已排除 AI 内容）。", "info");
    return;
  }
  const total = miss.reduce((n, r) => n + r.items.length, 0);
  const lines: string[] = [`以下为尚未汉化的界面文本（共 ${total} 条，已排除 AI 内容）：`];
  for (const r of miss) {
    lines.push("");
    lines.push(`▸ ${r.file.split(/[\\/]/).slice(-3).join("/")}（${r.items.length} 条，显示前 10 条）`);
    for (const i of r.items.slice(0, 10)) lines.push(`  · ${i.display}`);
  }
  ctx.ui.notify(lines.join("\n"), "info");
}

// ---------- /汉化 自动：扫描 + 翻译 + 应用 ----------
function withAnnotation(old: string, cn: string): string {
  return old.slice(0, -1) + `（${cn}）` + old.slice(-1);
}

type TranslateResult = { ok: true; lines: string[] } | { ok: false; reason: string };

async function translateTexts(ctx: any, texts: string[]): Promise<TranslateResult> {
  const registry = ctx?.modelRegistry;
  const model = ctx?.model ?? registry?.getAvailable?.()[0];
  if (!registry || !model) return { ok: false, reason: "没有可用模型（请先 /login 配置认证，或 /model 选择模型）" };
  const prompt = [
    "请把下面每一行英文界面文本翻译成简洁的中文（用于界面汉化的括号注释）。",
    "规则：",
    "1. 每行输入对应一行输出，按顺序一一对应，数量必须完全一致。",
    "2. 只输出中文译文本身，不要编号、不要前缀、不要解释。",
    "3. 保持简洁，一般不超过 12 个字。",
    "4. 保留技术名词（token、RPC、API 等）不翻译。",
    "",
    ...texts,
  ].join("\n");
  try {
    const context = {
      systemPrompt: "你是专业的中文界面汉化翻译助手。",
      messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
    };
    const result = await registry.complete(model, context);
    const text = (result.content ?? [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    const lines = text
      .split("\n")
      .map((s: string) => s.replace(/^\s*\d+[.、）)]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length !== texts.length) {
      return { ok: false, reason: `翻译结果行数不匹配（期望 ${texts.length} 行，得到 ${lines.length} 行）` };
    }
    return { ok: true, lines };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

async function flowAutoTranslate(ctx: any): Promise<void> {
  const results = collectAutoCandidates();
  const allItems = results.flatMap((r) => r.items);
  if (allItems.length === 0) {
    ctx.ui.notify("✅ 未发现需要自动汉化的界面文本。", "info");
    return;
  }
  ctx.ui.notify(`发现 ${allItems.length} 条界面文本，正在用当前模型翻译…`, "info");

  const cns = await translateTexts(ctx, allItems.map((i) => i.display));
  if (!cns.ok) {
    ctx.ui.notify(`翻译失败：${cns.reason}`, "error");
    return;
  }
  const lines = cns.lines;

  let idx = 0;
  let applied = 0;
  const errors: string[] = [];
  for (const r of results) {
    const pairs: Array<[string, string]> = [];
    for (const item of r.items) {
      const cn = (lines[idx++] ?? "").trim();
      if (!cn || cn === item.display) continue;
      pairs.push([item.old, withAnnotation(item.old, cn)]);
    }
    if (pairs.length === 0) continue;
    const res = applyAutoPairs(r.file, pairs);
    if (res.error) errors.push(res.error);
    if (res.hits > 0) {
      applied += res.hits;
      saveAutoPairs(r.file, pairs);
    }
  }
  if (errors.length > 0) {
    ctx.ui.notify(`⚠️ 部分失败：${errors.join("；")}`, "warning");
  } else if (applied === 0) {
    ctx.ui.notify("翻译完成但未应用（可能均已汉化）。", "info");
  } else {
    ctx.ui.notify(`✅ 已自动汉化 ${applied} 条界面文本。完全重启 Pi 后生效。`, "info");
  }
}

// ---------- /汉化 交互菜单（无参数时弹出） ----------
async function flowHanhuaMenu(ctx: any): Promise<void> {
  const pi = piRef!;
  const options = [
    "自动汉化：扫描 + 翻译 + 应用（新插件自动加注释）",
    "扫描界面：列出未汉化的英文文本",
    "补充命令：为命令补全添加中文说明",
    "界面状态：显示已汉化文件",
    "界面应用：重新应用补丁",
    "清空频率：重置命令使用频率",
  ];
  const picked = await ctx.ui.select("选择汉化操作（↑↓ 选择，回车确认，esc 取消）：", options);
  if (!picked) return;
  const idx = options.indexOf(picked);
  if (idx === 0) return flowAutoTranslate(ctx);
  if (idx === 1) return flowScanInterface(ctx);
  if (idx === 2) return flowTranslate(ctx, pi);
  if (idx === 3) return flowPatchCommand(["状态"], ctx);
  if (idx === 4) return flowPatchCommand(["应用"], ctx);
  if (idx === 5) return flowPatchCommand(["清空频率"], ctx);
}

// ---------- /汉化界面 命令 ----------
async function flowPatchCommand(rest: string[], ctx: any): Promise<void> {
  const dist = findPiDist();
  if (!dist) {
    ctx.ui.notify(
      "未找到 Pi 安装目录。可手动在 ~/.pi/agent/pi-cn.json 中配置 piDist 指向 Pi 的 dist 目录。",
      "error",
    );
    return;
  }
  const sub = (rest[0] ?? "").toLowerCase();

  if (sub === "应用" || sub === "apply") {
    const r = collectResults(applyAllPatches());
    if (r.errors.length > 0) ctx.ui.notify(`⚠️ 部分失败：${r.errors.join("；")}`, "warning");
    else if (r.files > 0)
      ctx.ui.notify(`✅ 已汉化 ${r.files} 个文件（${r.count} 条文本）。重启 Pi 生效。`, "info");
    else ctx.ui.notify("未发现可汉化的文本（可能已汉化）。", "info");
    return;
  }

  if (sub === "清空频率" || sub === "resetfreq") {
    clearFrequency();
    ctx.ui.notify("✅ 已清空命令使用频率，补全恢复按字母排序。", "info");
    return;
  }

  // 默认：显示状态
  const status = allPatchStatus();
  const hanhuaFiles = status.filter((s) => s.hanhua).length;
  const backupFiles = status.filter((s) => s.backup).length;
  ctx.ui.notify(
    [
      `Pi 安装目录：${dist}`,
      `已汉化文件：${hanhuaFiles}/${status.length}（备份 ${backupFiles} 个）`,
      "",
      "用法：/汉化 界面 [状态|应用|清空频率]",
    ].join("\n"),
    "info",
  );
}

// ---------- 注册 ----------
export default async function (pi: ExtensionAPI) {
  piRef = pi;

  // 1) 自动应用界面汉化补丁（幂等；失败不影响启动）
  try {
    const r = collectResults(applyAllPatches());
    if (r.errors.length > 0) {
      patchNotice = `界面汉化部分失败：${r.errors.join("；")}`;
    } else if (r.files > 0) {
      patchNotice = `界面汉化已自动应用/更新（${r.files} 个文件，${r.count} 条）。重启 Pi 后生效。`;
    } else {
      patchNotice = undefined;
    }
  } catch {
    // 补丁失败不影响插件其余功能
  }

  // 2) 补全 provider + 输入频率记录 + 启动提示
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.addAutocompleteProvider((current) => {
      setCurrentProvider(current);
      return buildProvider(pi, current);
    });
    if (patchNotice) {
      ctx.ui.notify(patchNotice, "info");
      patchNotice = undefined;
    }
  });

  // 手动输入 / 命令时也记录使用频率（补全选中已记录；此通道覆盖手动输入）
  pi.on("input", (event) => {
    recordFromInput(event.text);
  });

  // 3) 管理命令（单一入口）
  pi.registerCommand("汉化", {
    description: "汉化管理：/汉化 [自动|扫描|命令|界面 状态|界面 应用|界面 清空频率]",
    getArgumentCompletions: (prefix: string) => {
      const subs = ["自动", "扫描", "命令", "界面 状态", "界面 应用", "界面 清空频率"];
      const items = subs.map((value) => ({ value, label: value }));
      const filtered = items.filter((i) => i.value.startsWith(prefix));
      return filtered.length > 0 ? filtered : null;
    },
    handler: async (args: string, ctx: any) => {
      const rest = args.trim().split(/\s+/).filter(Boolean);
      const sub = (rest[0] ?? "").toLowerCase();
      if (!sub) return flowHanhuaMenu(ctx);
      if (sub === "自动") return flowAutoTranslate(ctx);
      if (sub === "扫描") return flowScanInterface(ctx);
      if (sub === "命令") return flowTranslate(ctx, pi);
      if (sub === "界面") return flowPatchCommand(rest.slice(1), ctx);
      // 兼容旧的直接子命令（状态/应用/清空频率）
      return flowPatchCommand(rest, ctx);
    },
  });
}

// 供调试/测试导出
export { readFrequency, clearFrequency };
