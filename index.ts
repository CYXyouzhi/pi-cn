/**
 * Pi 中文汉化插件（pi-cn）
 *
 * 三合一：
 *  1. / 命令补全中文说明 + 使用频率排序（纯插件，零侵入）
 *  2. 界面文本自动汉化补丁（加载时检测并应用，版本化备份 .bak.<版本>、语法校验、幂等）
 *  3. 管理命令：/汉化（交互菜单：自动汉化/扫描/补充命令/界面管理）
 *
 * 原则：只改用户可见界面文字与补全提示；AI 可见内容与逻辑标识一律不动。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  buildProvider,
  setCurrentProvider,
  recordFromInput,
  clearFrequency,
  readFrequency,
  readUserTable,
  writeUserTable,
  BUILTIN_CN,
  PLUGIN_CN,
} from "./lib.ts";
import {
  applyAllPatches,
  collectAutoCandidates,
  applyAutoPairsResilient,
  saveAutoPairs,
  readAutoMap,
  applyLocalePatches,
  revertAllPatches,
  type PatchResult,
} from "./patches.ts";
import { collectLocaleCandidates, writeLocaleMaps } from "./locale-pack.ts";
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

// ---------- /汉化 自动：扫描 + 翻译 + 应用 ----------
// 译文里出现引号 / 反斜杠 / 模板占位符，插进源码的字符串字面量里会直接破坏语法：
//   例如模型把 "Don't show" 译成含单引号的句子 → 所在字面量被提前闭合 → 整文件被语法校验证否 → 全部丢弃。
// 中文界面本来也用不上这几个 ASCII 符号（中文引号「」不在过滤范围），全部剔除。
function sanitizeCn(cn: string): string {
  return cn.replace(/[\\`"']/g, "").replace(/\$\{/g, "").trim();
}
function withAnnotation(old: string, cn: string): string {
  return old.slice(0, -1) + `（${sanitizeCn(cn)}）` + old.slice(-1);
}

type TranslateResult = { ok: true; lines: string[] } | { ok: false; reason: string };

async function translateTexts(ctx: any, texts: string[], kind: "ui" | "command" = "ui"): Promise<TranslateResult> {
  const registry = ctx?.modelRegistry;
  // 始终使用当前选中的模型；取不到就报错，不悄悄换成其他 provider 的模型
  const model = ctx?.model;
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
          "5. 遇到 camelCase 形式的设置键名（如 autoSelectSingleGoal、subtaskDepth），翻译成对应的中文描述（如「自动选择单个目标」「子任务深度」），不要原样返回英文。",
          "6. 禁止拆行、禁止合并、禁止输出空行。",
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
    // sessionId：opencode 系 provider 强制要求 x-opencode-session header，
    // 传入后 pi-ai 会自动补上（其他 provider 会忽略该字段）
    const opts = {
      ...((model as any)?.reasoning ? { reasoningEffort: "low" as const } : {}),
      sessionId: ctx?.sessionManager?.getSessionId?.(),
    } as any;
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

  // 先走语言包轨道：插件作者已提供官方中文（locales/zh.json）的直接采用，零 token，
  // 且作者翻译的准确度高于模型；未被语言包覆盖的才交给下面的模型翻译。
  let localeApplied = 0;
  try {
    const scan = collectLocaleCandidates();
    if (Object.keys(scan.maps).length > 0) {
      writeLocaleMaps(scan.maps);
      const lr = applyLocalePatches();
      localeApplied = lr.appliedCount;
      for (const e of lr.errors) ctx.ui.notify(`⚠️ 语言包补丁失败：${e}`, "warning");
    }
  } catch { /* 语言包轨道失败不阻断后续模型翻译 */ }

  const results = collectAutoCandidates();
  const allItems = results.flatMap((r) => r.items);
  if (allItems.length === 0) {
    ctx.ui.notify(
      localeApplied > 0
        ? `✅ 已用插件官方中文语言包汉化 ${localeApplied} 条，无其他待翻译文本。完全重启 Pi 后生效。`
        : "✅ 未发现需要自动汉化的界面文本。",
      "info",
    );
    return;
  }
  // 复用历史译文：同一文案常出现在多个文件（display.ts 的 label 与 commands.ts 的说明里
  // 都有 "Display mode"）。之前翻过的直接拿来用 —— 既省一次模型调用，
  // 也保证同一句话在所有文件里译法一致。
  const known: Record<string, string> = {};
  for (const pairs of Object.values(readAutoMap())) {
    for (const [old, nw] of pairs) known[old] = nw;
  }
  const unknown = allItems.filter((i) => !known[i.old]);

  if (unknown.length > 0) {
    ctx.ui.notify(
      `发现 ${allItems.length} 条界面文本（复用已有译文 ${allItems.length - unknown.length} 条），` +
        `正在翻译 ${unknown.length} 条…`,
      "info",
    );
    const cns = await translateTexts(ctx, unknown.map((i) => i.display));
    if (!cns.ok) {
      ctx.ui.notify(`翻译失败：${cns.reason}`, "error");
      return;
    }
    unknown.forEach((item, i) => {
      const cn = (cns.lines[i] ?? "").trim();
      if (cn && cn !== item.display) known[item.old] = withAnnotation(item.old, cn);
    });
  } else {
    ctx.ui.notify(`发现 ${allItems.length} 条界面文本，全部复用已有译文。`, "info");
  }

  let applied = 0;
  let dropped = 0;
  const errors: string[] = [];
  for (const r of results) {
    const pairs: Array<[string, string]> = [];
    for (const item of r.items) {
      const nw = known[item.old];
      if (!nw || nw === item.old) continue;
      pairs.push([item.old, nw]);
    }
    if (pairs.length === 0) continue;
    // 用「剔坏保好」版本：整批被语法校验证否时二分定位坏条目，其余照常落盘。
    // 为何不用 applyAutoPairs：它是整文件一次性替换，一条坏候选（多是扫描误抓的代码残片）
    // 会连坐同文件其余几十上百条，且失败批次不入表，下次重译重失败 —— 永远汉化不上。
    const res = applyAutoPairsResilient(r.file, pairs);
    if (res.error) errors.push(res.error);
    if (res.hits > 0) {
      applied += res.hits;
      saveAutoPairs(r.file, pairs);
    }
    dropped += res.dropped.length;
  }
  if (dropped > 0) {
    ctx.ui.notify(`已跳过 ${dropped} 条非界面文本候选（已记入黑名单，不再重复翻译）。`, "info");
  }
  if (errors.length > 0) {
    ctx.ui.notify(`⚠️ 部分失败：${errors.join("；")}`, "warning");
  } else if (applied === 0 && localeApplied === 0) {
    ctx.ui.notify("翻译完成但未应用（可能均已汉化）。", "info");
  } else {
    const parts: string[] = [];
    if (localeApplied > 0) parts.push(`官方语言包 ${localeApplied} 条`);
    if (applied > 0) parts.push(`模型翻译 ${applied} 条`);
    ctx.ui.notify(`✅ 已自动汉化：${parts.join(" + ")}。完全重启 Pi 后生效。`, "info");
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
    "将把所有已汉化的文件从版本化备份（.bak.<安装版本>）恢复成英文原版，并删除该备份。\n下次启动 Pi 时 pi-cn 会重新应用汉化。",
  );
  if (!ok) return;
  const r = revertAllPatches();
  if (r.restored === 0) {
    ctx.ui.notify(
      "没有可还原的文件（可能尚未汉化，或当前安装版本的备份已丢失）。" +
        (r.skipped > 0 ? `\n已跳过 ${r.skipped} 个目标。` : ""),
      "info",
    );
    return;
  }
  ctx.ui.notify(
    `✅ 已还原 ${r.restored} 个文件：\n${r.files.slice(0, 12).join("\n")}` +
      (r.files.length > 12 ? `\n… 另有 ${r.files.length - 12} 个` : "") +
      (r.skipped > 0 ? `\n\n跳过 ${r.skipped} 个（无当前版本的备份）` : "") +
      (r.stale > 0 ? `\n\n另有 ${r.stale} 个旧版本备份残留，可手动删除（*.bak.<旧版本号>）。` : "") +
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
    "自动汉化：体检 + 翻译 + 应用",
    "体检：检查映射有没有误伤代码",
    "清除：还原所有汉化（恢复英文原版）",
    "清空频率：重置命令使用频率",
  ];
  const picked = await ctx.ui.select("选择汉化操作（↑↓ 选择，回车确认，esc 取消）：", options);
  if (!picked) return;
  const idx = options.indexOf(picked);
  if (idx === 0) return flowAutoTranslate(ctx);
  if (idx === 1) return flowCheckup(ctx);
  if (idx === 2) return flowRevert(ctx);
  if (idx === 3) return flowClearFrequency(ctx);
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
