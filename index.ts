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
  readUserTable,
  writeUserTable,
  BUILTIN_CN,
  PLUGIN_CN,
} from "./lib.ts";
import {
  findPiDist,
  applyAllPatches,
  allPatchStatus,
  collectAutoCandidates,
  applyAutoPairs,
  saveAutoPairs,
  revertAllPatches,
  type PatchResult,
} from "./patches.ts";
import { runCheckup, formatCheckup } from "./checkup.ts";

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
    all.goalX,
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

async function translateTexts(ctx: any, texts: string[], kind: "ui" | "command" = "ui"): Promise<TranslateResult> {
  const registry = ctx?.modelRegistry;
  const model = ctx?.model ?? registry?.getAvailable?.()[0];
  if (!registry || !model) return { ok: false, reason: "没有可用模型（请先 /login 配置认证，或 /model 选择模型）" };

  // 候选文本可能含换行（源码中的 \n 转义被解码为真实换行），必须单行化，
  // 保证输入行数与条数一一对应（否则模型输出行数必然对不上）
  const inputs = texts.map((t) => t.replace(/\s+/g, " ").trim());

  const rules =
    kind === "command"
      ? [
          "请把下面每一行英文命令说明翻译成简洁的中文（用于 / 命令补全注释）。",
          "规则：",
          "1. 每行输入对应一行输出，按顺序一一对应，数量必须完全一致。",
          "2. 只输出中文译文本身，不要编号、不要前缀、不要解释。",
          "3. 保留命令用法/参数示例（如 /bg [--agent] <命令>、--tokens 100k）不要改格式，只译其中的单词。",
          "4. 保留技术名词（token、RPC、API、MCP 等）不翻译。",
          "5. 禁止拆行、禁止合并、禁止输出空行。",
        ]
      : [
          "请把下面每一行英文界面文本翻译成简洁的中文（用于界面汉化的括号注释）。",
          "规则：",
          "1. 每行输入对应一行输出，按顺序一一对应，数量必须完全一致。",
          "2. 只输出中文译文本身，不要编号、不要前缀、不要解释。",
          "3. 保持简洁，一般不超过 12 个字。",
          "4. 保留技术名词（token、RPC、API 等）不翻译。",
          "5. 禁止拆行、禁止合并、禁止输出空行。",
        ];

  // 统一的模型调用：负责 reasoningEffort、错误检查、剥代码围栏。
  // 关键：强制思考模型（如 zai 系 glm）不允许 thinking:disabled，
  // 不传 reasoningEffort 时底层会拼出 thinking:{type:"disabled"} 而 400（code 1210），
  // 导致 content 为空、行数解析得 0。传 "low" 让 zai 分支走 thinking:{type:"enabled"}。
  const callModel = async (prompt: string): Promise<string> => {
    const context = {
      systemPrompt: "你是专业的中文界面汉化翻译助手。",
      messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
    };
    const opts = (model as any)?.reasoning ? ({ reasoningEffort: "low" } as any) : undefined;
    const result = await registry.complete(model, context, opts);
    if (result?.stopReason === "error" || result?.errorMessage) {
      // 把底层真实错误（认证/限流/参数 400 等）直接暴露出来，不再报成“0 行”
      throw new Error(`模型调用失败（${result.stopReason ?? "unknown"}）：${result.errorMessage ?? "未知错误"}`);
    }
    // 剥掉 markdown 代码围栏与“翻译如下”类引导语，只留正文
    return (result.content ?? [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("")
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/^\s*(翻译(结果)?|译文)(如下)?[:：]?\s*$/gm, "");
  };

  const complete = async (extra: string): Promise<string[]> => {
    const prompt = [...rules, extra, "", ...inputs].join("\n");
    const text = await callModel(prompt);
    return text
      .split("\n")
      .map((s: string) => s.replace(/^\s*\d+[.、）)]\s*/, "").trim())
      .filter(Boolean);
  };

  // 兑底：单条翻译（一次一行，行数天然一致）；空回复/失败时抛错由调用方处理
  const completeOne = async (text: string): Promise<string> => {
    const prompt = [
      `把下面这句英文${kind === "command" ? "命令说明" : "界面文本"}翻译成简洁的中文（保留 token、RPC、API 等技术名词与 / 命令参数格式）。只输出译文本身，一行，不要编号、解释或代码围栏。`,
      text,
    ].join("\n");
    const out = await callModel(prompt);
    const first = out.split("\n").map((s: string) => s.trim()).filter(Boolean)[0] ?? "";
    if (!first) throw new Error("空回复");
    return first;
  };

  try {
    let lines = await complete("");
    if (lines.length !== inputs.length) {
      // 行数不符：明确告知模型后重试一次（模型偶发拆行/空行，重试通常可修正）
      lines = await complete(
        `注意：上次输出 ${lines.length} 行但输入是 ${inputs.length} 行。这次必须严格一行一条，数量完全一致，不要空行。`,
      );
    }
    if (lines.length !== inputs.length) {
      // 整批仍对不齐：降级为逐条翻译，单条失败保留英文原文，不让整批报废
      const fallback: string[] = [];
      for (const t of inputs) {
        try {
          fallback.push(await completeOne(t));
        } catch {
          fallback.push(t);
        }
      }
      lines = fallback;
    }
    // 译文强制单行（防止含换行破坏括号注释 / 源码语法）
    const clean = lines.map((l) => l.replace(/\s+/g, " ").trim());
    return { ok: true, lines: clean };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

async function flowAutoTranslate(ctx: any): Promise<void> {
  // 先体检：把已有映射的风险挑出来（避免「翻译对了但功能坏了」），失败不阻断主流程
  try {
    const chk = runCheckup();
    const dangers = chk.issues.filter((i) => i.kind === "compare");
    if (dangers.length > 0) {
      ctx.ui.notify(
        `⚠️ 体检发现 ${dangers.length} 条映射参与逻辑比较，建议先 /汉化 体检 查看：\n` +
          dangers.slice(0, 5).map((i) => `  · [${i.label}] ${i.key.slice(0, 46)}`).join("\n"),
        "warning",
      );
    }
  } catch { /* 体检失败不影响汉化 */ }

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

  // 顺带：自动翻译新插件的命令说明（未收录的命令 → 写入用户表，立即生效）
  await flowAutoTranslateCommands(ctx);
}

// ---------- /汉化 自动 内嵌：新命令自动翻译 ----------
async function flowAutoTranslateCommands(ctx: any): Promise<void> {
  let dynamic: { name: string; description?: string }[] = [];
  try {
    dynamic = piRef!.getCommands().map((c) => ({ name: c.name, description: c.description }));
  } catch {
    dynamic = [];
  }
  const user = readUserTable();
  const untranslated = dynamic.filter(
    (e) => !user[e.name] && !BUILTIN_CN[e.name] && !PLUGIN_CN[e.name],
  );
  if (untranslated.length === 0) return;

  const texts = untranslated.map((e) => e.description ?? e.name);
  const cns = await translateTexts(ctx, texts, "command");
  if (!cns.ok) {
    ctx.ui.notify(`⚠️ ${untranslated.length} 条命令说明翻译失败：${cns.reason}（可稍后用 /汉化 命令 手动补充）`, "warning");
    return;
  }
  const table = { ...user };
  let saved = 0;
  untranslated.forEach((e, i) => {
    const cn = (cns.lines[i] ?? "").trim();
    if (!cn) return;
    table[e.name] = cn;
    saved++;
  });
  if (saved === 0) return;
  writeUserTable(table);
  ctx.ui.notify(`✅ 已自动翻译 ${saved} 条命令说明（新插件命令立即生效）。`, "info");
}

// ---------- /汉化 体检 ----------
async function flowCheckup(ctx: any): Promise<void> {
  ctx.ui.notify("正在体检映射表…", "info");
  try {
    const r = runCheckup();
    ctx.ui.notify(formatCheckup(r), r.issues.some((i) => i.kind === "compare") ? "warning" : "info");
  } catch (e) {
    ctx.ui.notify(`体检失败：${e instanceof Error ? e.message : String(e)}`, "error");
  }
}

// ---------- /汉化 清除（还原英文） ----------
async function flowRevert(ctx: any): Promise<void> {
  const ok = await ctx.ui.confirm(
    "确认还原？",
    "将把所有已汉化的文件从 .bak 恢复成英文原版，并删除备份。\n下次启动 Pi 时 pi-cn 会重新应用汉化。",
  );
  if (!ok) return;
  const r = revertAllPatches();
  if (r.restored === 0) {
    ctx.ui.notify("没有可还原的文件（可能尚未汉化，或备份已丢失）。", "info");
    return;
  }
  ctx.ui.notify(
    `✅ 已还原 ${r.restored} 个文件：\n${r.files.slice(0, 12).join("\n")}` +
      (r.files.length > 12 ? `\n… 另有 ${r.files.length - 12} 个` : "") +
      (r.skipped > 0 ? `\n\n跳过 ${r.skipped} 个（无备份）` : "") +
      "\n\n重启 Pi 前界面仍显示中文（内存中的代码已加载）。",
    "info",
  );
}

// ---------- /汉化 频率 ----------
async function flowClearFrequency(ctx: any): Promise<void> {
  clearFrequency();
  ctx.ui.notify("✅ 已清空命令使用频率，补全恢复按字母排序。", "info");
}

// ---------- /汉化 交互菜单（无参数时弹出） ----------
async function flowHanhuaMenu(ctx: any): Promise<void> {
  const options = [
    "自动汉化：体检 + 扫描 + 翻译 + 应用",
    "清除：还原所有汉化（恢复英文原版）",
    "清空频率：重置命令使用频率",
  ];
  const picked = await ctx.ui.select("选择汉化操作（↑↓ 选择，回车确认，esc 取消）：", options);
  if (!picked) return;
  const idx = options.indexOf(picked);
  if (idx === 0) return flowAutoTranslate(ctx);
  if (idx === 1) return flowRevert(ctx);
  if (idx === 2) return flowClearFrequency(ctx);
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
    description: "汉化管理：/汉化 [自动|清除|频率|体检]",
    getArgumentCompletions: (prefix: string) => {
      const subs = ["自动", "清除", "频率", "体检"];
      const items = subs.map((value) => ({ value, label: value }));
      const filtered = items.filter((i) => i.value.startsWith(prefix));
      return filtered.length > 0 ? filtered : null;
    },
    handler: async (args: string, ctx: any) => {
      const sub = (args.trim().split(/\s+/)[0] ?? "").toLowerCase();
      if (!sub) return flowHanhuaMenu(ctx);
      if (sub === "自动") return flowAutoTranslate(ctx);
      if (sub === "清除") return flowRevert(ctx);
      if (sub === "频率") return flowClearFrequency(ctx);
      if (sub === "体检") return flowCheckup(ctx);
      return flowHanhuaMenu(ctx);
    },
  });
}

// 供调试/测试导出
export { readFrequency, clearFrequency };
