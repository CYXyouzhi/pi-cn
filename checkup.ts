/**
 * 映射体检（checkup.ts）
 *
 * 为什么需要：pi-cn 的汉化本质是「文本层手术」——对源码文件做
 * src.split(英文).join(中文)。这带来三类隐患：
 *
 *   ① 逻辑比较：若 value === "Export as Zip" 这类字符串既用于显示又参与判断，
 *      替换后一旦比较的对面来自别的文件/层，判断就永假。
 *   ② 边界误伤：不带引号的短 key 会命中「以它开头的其他文案」，
 *      如 "Unknown error" 会把 "Unknown error occurred" 变成 "未知错误 occurred"。
 *   ③ 版本漂移：pi 升级改了文案，旧 key 失效，汉化静默丢失。
 *
 * 本模块在应用前把这三类风险挑出来，避免「翻译对了但功能坏了」。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { collectTargets, existingBackupFor } from "./patches.ts";
import { isExportedMember } from "./locale-pack.ts";

export type IssueKind = "template" | "compare" | "identifier" | "duplicate" | "stale" | "exported";

export interface CheckupIssue {
  label: string;
  key: string;
  kind: IssueKind;
  detail: string;
}

export interface CheckupResult {
  issues: CheckupIssue[];
  checked: number;
  files: number;
}

/** 取「未汉化原文」：优先当前版本的版本化备份，回退旧式 .bak，都没有则用当前文件 */
function originalText(file: string): { text: string; fromBak: boolean } | undefined {
  const bak = existingBackupFor(file);
  try {
    if (bak) return { text: fs.readFileSync(bak, "utf8"), fromBak: true };
    return { text: fs.readFileSync(file, "utf8"), fromBak: false };
  } catch {
    return undefined;
  }
}

/** 找出 key 的所有出现位置（上限 50 处，避免病态输入拖慢） */
function findPositions(src: string, key: string): number[] {
  const out: number[] = [];
  let i = -1;
  while ((i = src.indexOf(key, i + 1)) !== -1) {
    out.push(i);
    if (out.length >= 50) break;
  }
  return out;
}

/** 该位置两侧是否紧邻比较运算符（=== / !== / == / !=） */function nearComparison(src: string, pos: number, len: number): boolean {
  const before = src.slice(Math.max(0, pos - 16), pos);
  const after = src.slice(pos + len, pos + len + 16);
  return /[=!]==?\s*$/.test(before) || /^\s*[=!]==?/.test(after);
}

// 映射源文件里用反引号做字符串界定符是致命错误：
// 形如 [`Sign in with ${x}`] 会在模块加载时真的求值 ${x} → ReferenceError → 整个扩展加载失败，
// 而那时体检本身也跑不起来。所以这里在体检入口先扫源文件（运行时无法区分两种写法）。
const DATA_FILES = ["pi-ui-cn-data.ts", "plan-cn-data.ts", "goalx-cn-data.ts", "btw-cn-data.ts"];
function checkTemplateLiterals(issues: CheckupIssue[]): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const f of DATA_FILES) {
    let text: string;
    try { text = fs.readFileSync(path.join(here, f), "utf8"); } catch { continue; }
    text.split("\n").forEach((ln, i) => {
      if (/\[\s*`/.test(ln) || /,\s*`[^`]*`\s*\]/.test(ln)) {
        issues.push({
          label: f,
          key: ln.trim().slice(0, 70),
          kind: "template",
          detail: "映射用了反引号模板串：加载时 ${...} 会被求值，整个扩展会加载失败（改用双引号包裹）",
        });
      }
    });
  }
}

// 带引号的 key：若该文本在原文里只用了一种引号（无 '...' / `...` 变体），
// 则 split/join 会把所有出现（含比较处）一并替换，两侧始终一致，比较不会失效。
// 实例：[\"Yes\",\"No\"] 与 ===\"Yes\" 都是双引号 → 汉化后两侧同为「Yes（是）」✓
function allSameQuoteForm(text: string, core: string, hasQuote: boolean): boolean {
  if (!hasQuote) return false; // 裸串没有边界，比较风险仍需提示
  const forms = ['"', "'", "`"].filter((q) => text.includes(q + core + q)).length;
  return forms <= 1;
}

export function runCheckup(): CheckupResult {
  const targets = collectTargets();
  const issues: CheckupIssue[] = [];
  let checked = 0;
  checkTemplateLiterals(issues);

  for (const t of targets) {
    const orig = originalText(t.file);
    if (!orig) continue;
    const { text, fromBak } = orig;

    for (const [key] of t.pairs) {
      // 去掉 key 外层的引号，取会真正出现在文件里的文本
      const core = key.replace(/^["'`]/, "").replace(/["'`]$/, "");
      if (core.length < 3) continue;
      checked++;
      // 带引号的 key 有天然边界，用完整形态（含引号）定位：
      // 否则 core 会命中标识符里的同名字串，例如 "Transport" 撞上 commandTransport==="stdin"，
      // 被误报成「参与逻辑比较」。
      const hasQuote = /["'`]/.test(key);
      const probe = hasQuote ? key : core;

      const positions = findPositions(text, probe);
      if (positions.length === 0) {
        // 原文里都没有说明这条映射已经彻底失效（pi 改文案了）
        if (fromBak) issues.push({ label: t.label, key: core, kind: "stale", detail: "原文中已找不到（pi 可能改了文案）" });
        continue;
      }
      if (positions.some((p) => nearComparison(text, p, probe.length)) && !allSameQuoteForm(text, core, hasQuote)) {
        issues.push({ label: t.label, key: core, kind: "compare", detail: "该文案同时参与字符串比较，且原文里存在不同引号形态：只有一种形态会被替换，比较的另一侧会失效" });
        continue;
      }
      // 字面量若是「导出对象的成员」，可能既是显示文案又是逻辑校验值。
      // 实例：ROW_INTENT_META.other.label 既喂给 displayLabel() 显示，
      // 又被 RESERVED_LABEL_SET 拿去校验（对面来自模型输入）。
      // nearComparison 看不见这类风险 —— 数据流跨了对象属性与文件边界，字面量旁边没有比较运算符。
      if (positions.some((p) => isExportedMember(text, p))) {
        issues.push({
          label: t.label,
          key: core,
          kind: "exported",
          detail: "位于导出对象内（可能既是显示文案又是逻辑校验值），替换后 canonical 值会变，建议移除",
        });
        continue;
      }
      // 裸串紧邻标识符字符 → 会直接改坏代码。
      // 实例：裸串 "Assistant" 命中函数名 isAssistantMessage，替换后成为 isAssistant（助手）Message，
      // 插件因语法错误无法加载，pi 启动直接报 ParseError。
      if (!hasQuote) {
        const broken = positions.some(
          (p) => /[A-Za-z0-9_]/.test(text[p + core.length] ?? "") || /[A-Za-z0-9_]/.test(text[p - 1] ?? ""),
        );
        if (broken) {
          issues.push({
            label: t.label,
            key: core,
            kind: "identifier",
            detail: "裸串紧邻标识符，会改坏代码（需加引号或更长上下文限定）",
          });
          continue;
        }
      }
      // 只在「完全不含引号」的裸串上提示重复：
      // 含引号的 key 有天然边界（如 "Export as Zip"），多处出现通常同义；
      // 而裸串（如 Unknown error）没有边界，才是误伤源头。
      if (!hasQuote && positions.length > 1) {
        issues.push({ label: t.label, key: core, kind: "duplicate", detail: `出现 ${positions.length} 处，可能误伤其他位置` });
      }
    }
  }
  return { issues, checked, files: targets.length };
}

export function formatCheckup(r: CheckupResult): string {
  const { issues, checked, files } = r;
  if (issues.length === 0) {
    return `✅ 体检通过\n${files} 个文件 / ${checked} 条映射，未发现风险。`;
  }
  const groups: Array<[IssueKind, string]> = [
    ["template", "🛑 映射用了反引号模板串（会导致扩展加载失败，必须修）"],
    ["identifier", "🛑 裸串紧邻标识符（会改坏代码，必须修）"],
    ["compare", "⚠️ 参与逻辑比较（有功能损坏风险）"],
    ["exported", "⚠️ 位于导出对象内（可能既是显示文案又是逻辑校验值）"],
    ["duplicate", "⚠️ 重复出现（可能误伤）"],
    ["stale", "ℹ️ 已失效（pi 改过文案）"],
  ];
  const lines: string[] = [`体检结果：${files} 个文件 / ${checked} 条映射，发现 ${issues.length} 处问题`, ""];
  for (const [kind, title] of groups) {
    const list = issues.filter((i) => i.kind === kind);
    if (list.length === 0) continue;
    lines.push(`${title}（${list.length}）`);
    for (const i of list.slice(0, 12)) {
      lines.push(`  · [${i.label}] ${i.key.slice(0, 60)}`);
      lines.push(`      ${i.detail}`);
    }
    if (list.length > 12) lines.push(`  … 另有 ${list.length - 12} 条`);
    lines.push("");
  }
  lines.push("建议：identifier 类必须立即修（否则插件加载会失败）；compare 类应从表中移除或改成更精确的 key。");
  return lines.join("\n");
}
