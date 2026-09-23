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
import { collectTargets } from "./patches.ts";

export type IssueKind = "compare" | "identifier" | "duplicate" | "stale";

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

/** 取「未汉化原文」：优先 .bak（原始英文），没有则用当前文件 */
function originalText(file: string): { text: string; fromBak: boolean } | undefined {
  const bak = file + ".bak";
  try {
    if (fs.existsSync(bak)) return { text: fs.readFileSync(bak, "utf8"), fromBak: true };
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

/** 该位置两侧是否紧邻比较运算符（=== / !== / == / !=） */
function nearComparison(src: string, pos: number, len: number): boolean {
  const before = src.slice(Math.max(0, pos - 16), pos);
  const after = src.slice(pos + len, pos + len + 16);
  return /[=!]==?\s*$/.test(before) || /^\s*[=!]==?/.test(after);
}

export function runCheckup(): CheckupResult {
  const targets = collectTargets();
  const issues: CheckupIssue[] = [];
  let checked = 0;

  for (const t of targets) {
    const orig = originalText(t.file);
    if (!orig) continue;
    const { text, fromBak } = orig;

    for (const [key] of t.pairs) {
      // 去掉 key 外层的引号，取会真正出现在文件里的文本
      const core = key.replace(/^["'`]/, "").replace(/["'`]$/, "");
      if (core.length < 3) continue;
      checked++;

      const positions = findPositions(text, core);
      if (positions.length === 0) {
        // .bak 里都没有说明这条映射已经彻底失效（pi 改文案了）
        if (fromBak) issues.push({ label: t.label, key: core, kind: "stale", detail: "原文中已找不到（pi 可能改了文案）" });
        continue;
      }
      if (positions.some((p) => nearComparison(text, p, core.length))) {
        issues.push({ label: t.label, key: core, kind: "compare", detail: "参与逻辑比较（跨文件/跨层时会导致判断失效）" });
        continue;
      }
      // 裸串紧邻标识符字符 → 会直接改坏代码。
      // 实例：裸串 "Assistant" 命中函数名 isAssistantMessage，替换后成为 isAssistant（助手）Message，
      // 插件因语法错误无法加载，pi 启动直接报 ParseError。
      const hasQuote = /["'`]/.test(key);
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
    ["identifier", "🛑 裸串紧邻标识符（会改坏代码，必须修）"],
    ["compare", "⚠️ 参与逻辑比较（有功能损坏风险）"],
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
