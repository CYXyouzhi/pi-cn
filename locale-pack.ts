/**
 * 语言包消费层（locale-pack.ts）
 *
 * 双轨制里的第一条轨道：
 *   插件作者已提供官方中文语言包（locales/zh.json）→ 直接采用作者翻译
 *   没有语言包的 → 交给 patches.ts 的模型翻译（第二条轨道）
 *
 * 为什么不做任何运行时依赖：
 *   这类插件的文案都经 t(key, fallback) 取出，语言包缺失时原样返回 fallback，
 *   而 fallback 就是源码里的英文字面量。把字面量替换成「英文（中文）」，
 *   效果等同于装了官方语言运行时，且不需要任何第三方 SDK。
 *
 * 风格：与 pi-cn 现有做法一致 —— 英文原文保留，括号里补中文注释。
 *       locales/en.json  "hint.enter": "Enter to select"
 *       locales/zh.json  "hint.enter": "回车选择"
 *              ↓ 配对
 *       源码里  "Enter to select"  →  "Enter to select（回车选择）"
 *
 * 三道筛子（宁可漏译，不可误译）：
 *   ① 源码存在性：字面量必须真的出现在插件源码里，否则映射无意义
 *   ② 中文可用性：zh 语言包缺该 key，或中文与英文相同 → 交回模型翻译
 *   ③ 逻辑安全：字面量若是「导出对象的成员」，可能同时参与逻辑校验
 *      （实例：ROW_INTENT_META.other.label 既用于显示，又是 RESERVED_LABEL_SET 的数据源），
 *      这类一律跳过 —— 纯文本体检看不出跨对象、跨文件的数据流。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

// ---------- 路径与常量 ----------

export const LOCALE_MAP_FILE = path.join(homedir(), ".pi", "agent", "pi-cn-locale.json");

const PLUGIN_ROOTS = [
  path.join(homedir(), ".pi", "agent", "npm", "node_modules"),
  path.join(homedir(), ".pi", "agent", "extensions"),
];

/** 语言包可能所在的目录名 */
const LOCALE_DIR_NAMES = ["locales", "i18n", "lang"];
/** 英文/中文语言包的候选文件名（大小写变体一并覆盖） */
const EN_NAMES = ["en.json", "en-US.json", "en-us.json", "en_US.json"];
const ZH_NAMES = ["zh.json", "zh-CN.json", "zh-cn.json", "zh_CN.json", "zh-Hans.json", "zh-hans.json"];

const SOURCE_EXT = [".ts", ".js"];
const SKIP_DIRS = new Set(["node_modules", ".git", "test", "tests", "docs", "dist", "bundle"]);
const BAK_RE = /\.bak(\.|$)/;

// ---------- 类型 ----------

export interface LocalePack {
  /** 包标识，如 @juicesharp/rpiv-ask-user-question */
  plugin: string;
  /** 包目录绝对路径 */
  dir: string;
  en: string;
  zh: string;
}

export interface LocaleSkip {
  plugin: string;
  key: string;
  text: string;
  reason: string;
}

export interface LocaleScanResult {
  packs: LocalePack[];
  /** 文件路径 -> [英文带引号字面量, 英文（中文）] */
  maps: Record<string, Array<[string, string]>>;
  skips: LocaleSkip[];
  /** 参与扫描的源码文件数 */
  sourceFiles: number;
}

// ---------- 发现语言包 ----------

function isPiPlugin(pkgDir: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
    return (
      !!pkg.pi ||
      (Array.isArray(pkg.keywords) &&
        (pkg.keywords.includes("pi-package") || pkg.keywords.includes("pi-extension")))
    );
  } catch {
    return false;
  }
}

function listPackageDirs(): string[] {
  const out: string[] = [];
  for (const root of PLUGIN_ROOTS) {
    if (!fs.existsSync(root)) continue;
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (e.name.startsWith("@")) {
        let scoped;
        try {
          scoped = fs.readdirSync(path.join(root, e.name), { withFileTypes: true });
        } catch {
          scoped = [];
        }
        for (const se of scoped) if (se.isDirectory()) out.push(path.join(root, e.name, se.name));
      } else if (e.isDirectory()) {
        out.push(path.join(root, e.name));
      }
    }
  }
  return out;
}

function pickLocaleFile(dir: string, names: string[]): string | undefined {
  for (const sub of LOCALE_DIR_NAMES) {
    const d = path.join(dir, sub);
    if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue;
    let files: string[];
    try {
      files = fs.readdirSync(d);
    } catch {
      continue;
    }
    for (const want of names) {
      const hit = files.find((f) => f.toLowerCase() === want.toLowerCase());
      if (hit) return path.join(d, hit);
    }
  }
  return undefined;
}

/** 找出所有「同时有英文和中文语言包」的 pi 插件 */
export function findLocalePacks(): LocalePack[] {
  const out: LocalePack[] = [];
  for (const dir of listPackageDirs()) {
    const base = path.basename(dir);
    if (base === "pi-cn") continue; // 排除自身
    const hasPkg = fs.existsSync(path.join(dir, "package.json"));
    if (hasPkg && !isPiPlugin(dir)) continue;
    const en = pickLocaleFile(dir, EN_NAMES);
    if (!en) continue;
    const zh = pickLocaleFile(dir, ZH_NAMES);
    if (!zh) continue;
    const owner = path.basename(path.dirname(dir));
    const plugin = owner.startsWith("@") ? owner + "/" + base : base;
    out.push({ plugin, dir, en, zh });
  }
  return out;
}

// ---------- 源码文件遍历 ----------

function isSourceFile(name: string): boolean {
  if (name.endsWith(".d.ts") || name.endsWith(".d.mts") || name.endsWith(".d.cts")) return false;
  if (!SOURCE_EXT.some((x) => name.endsWith(x))) return false;
  if (BAK_RE.test(name) || name.endsWith(".map")) return false;
  if (name.includes(".bundle.") || name.includes(".min.")) return false;
  return true;
}

function collectSources(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      collectSources(p, out);
      continue;
    }
    if (isSourceFile(e.name)) out.push(p);
  }
  return out;
}

// ---------- 字面量定位 ----------

/**
 * 算 from..to 区间内某种括号的深度差（> 0 表示仍未闭合）。
 * 带字符串感知：跳过 " " / ' ' / ` ` 内部的括号，避免把字符串里的 { 当成代码结构。
 */
function depthAt(src: string, from: number, to: number, openChar: string): number {
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inStr: string | undefined;
  for (let i = from; i < to; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = undefined;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;
  }
  return depth;
}

interface Decl {
  name: string;
  exported: boolean;
  /** 开括号（{ 或 [）的下标 */
  open: number;
  ch: string;
}

/** 一次性抽出全文的 `const/let/var NAME = {` 与 `= [` 声明位置 */
function collectDecls(src: string): Decl[] {
  const re = /(export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]*)?=\s*([{[])/g;
  const out: Decl[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    out.push({ name: m[2], exported: !!m[1], open: m.index + m[0].length - 1, ch: m[3] });
  }
  return out;
}

// 缓存：同一份源码会被多个候选反复查询（pi 主 chunk 上最多 189 个），
// 不缓存的话每查一次声明都要正则扫一遍全文，会明显变慢。
// 用字符串本身作 key：V8 先比引用，命中时几乎零开销；上限 8 份防止吃内存。
const DECL_CACHE_MAX = 8;
const declCache = new Map<string, Decl[]>();
function declsOf(src: string): Decl[] {
  const hit = declCache.get(src);
  if (hit) return hit;
  const decls = collectDecls(src);
  if (declCache.size >= DECL_CACHE_MAX) declCache.clear();
  declCache.set(src, decls);
  return decls;
}

/**
 * 找包住该位置的最内层 `const/let/var NAME = {` 或 `= [` 声明，并记录它是否 export。
 *
 * 为什么不能用「往前找最近的 export const」了事：那样会跨越作用域边界。
 * 实测误报：goal-settings.ts 里函数内的局部 `const rows = [{ label: ... }]`
 * 会被几十行外某个毫不相干的 `export const DEFAULT_GOAL_KEYBINDINGS = {` 误判成导出成员。
 * 所以必须逐个声明做括号配平，确认字面量真的在那个声明的直接作用域内。
 */
function findEnclosingDecl(src: string, pos: number): Decl | undefined {
  const decls = declsOf(src);
  for (let i = decls.length - 1; i >= 0; i--) {
    const d = decls[i];
    if (d.open > pos) continue;
    if (depthAt(src, d.open, pos, d.ch) > 0) return d;
  }
  return undefined;
}

/**
 * 找出文本在源码里以完整字面量形式出现的所有位置。
 * 只认「前后引号成对」的出现（"x" / 'x' / `x`），避免命中标识符或长文案的前缀。
 */
function findLiteralHits(
  src: string,
  text: string,
): Array<{ pos: number; form: string }> {
  const out: Array<{ pos: number; form: string }> = [];
  let i = -1;
  while ((i = src.indexOf(text, i + 1)) !== -1) {
    const q = src[i - 1];
    const q2 = src[i + text.length];
    if ((q === '"' || q === "'" || q === "`") && q2 === q) out.push({ pos: i - 1, form: q + text + q });
  }
  return out;
}

/** 占位符归一化标记：不可能出现在源码文本里的字符 */
const PH = "\u0000";

/** 把语言包里的 `{xxx}` 占位符换成统一标记 */
function normLocale(text: string): string {
  return text.replace(/\{[A-Za-z_][\w.]*\}/g, PH);
}

/** 把模板串里的 `${...}` 插值换成统一标记（去掉首尾反引号，好跟语言包文本对齐） */
function normTemplate(text: string): string {
  const inner = text.length >= 2 && text.startsWith("`") && text.endsWith("`") ? text.slice(1, -1) : text;
  return inner.replace(/\$\{[^}]*\}/g, PH);
}

/** 去掉中文里的占位符，用作括号注释 */
function cleanPlaceholders(text: string): string {
  return text.replace(/\{[A-Za-z_][\w.]*\}/g, "").replace(/\s+/g, " ").trim();
}

/**
 * 找出源码里「求值结果等于 en 文本」的模板串。
 *
 * 为什么需要单独一条路径：插件把带插值的提示写成模板串，
 *     export const KEY_PLACEHOLDER = "{key}";
 *     export const HINT_PART_COLLAPSE_TEMPLATE = `${KEY_PLACEHOLDER} to collapse`;
 * 而语言包里对应的值是 "{key} to collapse" —— 两串文本不同（`${KEY_PLACEHOLDER}` vs `{key}`），
 * 但求值结果一致。把两边的占位符都归一化后就能对上。
 * 注意：`{key} to expand · Esc to cancel` 这类由多个常量 join 出来的文案匹配不到，会自然跳过。
 */
function findTemplateHits(src: string, enText: string): Array<{ pos: number; form: string }> {
  const target = normLocale(enText);
  if (target === enText) return []; // 不含插值，走字面量那条路径即可
  const out: Array<{ pos: number; form: string }> = [];
  const re = /`(?:[^`\\]|\\.)*`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (normTemplate(m[0]) === target) out.push({ pos: m.index, form: m[0] });
  }
  return out;
}

/**
 * 该导出符号是否真的被用于「集合构造 / 成员判定」这类逻辑用途。
 *
 * 用来把两类外表相似的导出对象分开：
 *   危险：ROW_INTENT_META —— 旁边有 new Set<string>([...ROW_INTENT_META[k].label])
 *         它的 label 会被收进 RESERVED_LABEL_SET 做校验
 *   安全：PROVIDERS = [{ label: "LM Studio" }, ...] —— 只被 map 出来渲染
 *         同是导出对象的成员，但没有任何逻辑消费者
 */
const LOGIC_USE = /new\s+Set\s*[<(]|\.has\s*\(|Object\.values\s*\(|\bswitch\s*\(/;

function symbolHasLogicUse(src: string, name: string): boolean {
  const re = new RegExp("\\b" + name + "\\b", "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const ctx = src.slice(Math.max(0, m.index - 300), m.index + 300);
    if (LOGIC_USE.test(ctx)) return true;
  }
  return false;
}

/**
 * 字面量是否位于「导出对象/数组的成员」位置，且该导出符号带有逻辑消费者。
 *
 * 危险样本（必须跳过）：
 *   export const ROW_INTENT_META = { other: { label: "Type something." } }
 *   该 label 既喂给 displayLabel() 显示，又被 RESERVED_LABEL_SET 拿去校验；
 *   替换后 canonical 值变了，而校验对面来自模型输入 —— 跨文件的数据流，
 *   纯文本体检（只看字面量旁 16 字符有无 ===）根本看不见。
 *
 * 安全样本（可替换）：
 *   export const HINT_PART_ENTER = "Enter to select";      直接赋值的纯显示常量
 *   const rows = [{ label: "auditor disabled" }];          函数内局部数组（非导出）
 *   export const PROVIDERS = [{ label: "LM Studio" }];     导出但只用于渲染
 */
export function isExportedMember(src: string, quotePos: number): boolean {
  // 直接赋值给常量的字符串（export const X = "文案"）是纯显示文案，安全。
  if (/=\s*$/.test(src.slice(Math.max(0, quotePos - 20), quotePos))) return false;
  // 必须是对象/数组的成员位置（紧邻 `属性名:` 形式）
  const before = src.slice(Math.max(0, quotePos - 120), quotePos);
  if (!/(?:^|[{,])\s*(?:[A-Za-z_$][\w$]*|"[^"]*"|'[^']*')\s*:\s*$/.test(before)) return false;
  const decl = findEnclosingDecl(src, quotePos);
  if (!decl?.exported) return false;
  return symbolHasLogicUse(src, decl.name);
}

// ---------- 配对与筛选 ----------

interface BuiltPair {
  file: string;
  old: string;
  neu: string;
}

function buildPairsFor(pack: LocalePack): { pairs: BuiltPair[]; skips: LocaleSkip[] } {
  const pairs: BuiltPair[] = [];
  const skips: LocaleSkip[] = [];

  let enMap: Record<string, string>;
  let zhMap: Record<string, string>;
  try {
    enMap = JSON.parse(fs.readFileSync(pack.en, "utf8"));
    zhMap = JSON.parse(fs.readFileSync(pack.zh, "utf8"));
  } catch {
    return { pairs, skips };
  }

  const sourceFiles = collectSources(pack.dir);
  const sources = sourceFiles.map((f) => ({ f, src: fs.readFileSync(f, "utf8") }));

  for (const [key, enText] of Object.entries(enMap)) {
    if (key.startsWith("_meta") || typeof enText !== "string" || !enText) continue;

    // 筛 ②：中文可用性
    const zhText = zhMap[key];
    if (typeof zhText !== "string" || !zhText.trim()) {
      skips.push({ plugin: pack.plugin, key, text: enText, reason: "zh 语言包缺该 key，交回模型翻译" });
      continue;
    }
    if (zhText === enText) {
      skips.push({ plugin: pack.plugin, key, text: enText, reason: "中英文相同，无需替换" });
      continue;
    }

    // 筛 ①：源码存在性。先找普通字面量；找不到时再找「求值结果等于 en」的模板串。
    let hitsByFile = sources
      .map(({ f, src }) => ({ f, hits: findLiteralHits(src, enText) }))
      .filter((x) => x.hits.length > 0);
    let templateMode = false;
    if (hitsByFile.length === 0) {
      const tpl = sources
        .map(({ f, src }) => ({ f, hits: findTemplateHits(src, enText) }))
        .filter((x) => x.hits.length > 0);
      if (tpl.length === 0) {
        skips.push({ plugin: pack.plugin, key, text: enText, reason: "源码中未找到该英文（字面量与模板串均无匹配）" });
        continue;
      }
      hitsByFile = tpl;
      templateMode = true;
    }

    const forms = new Set<string>();
    for (const { hits } of hitsByFile) for (const h of hits) forms.add(h.form);
    if (forms.size === 0) {
      skips.push({ plugin: pack.plugin, key, text: enText, reason: "源码中未找到该英文完整字面量" });
      continue;
    }

    // 筛 ③：逻辑安全（任一出现位置落在导出对象内即视为危险）
    let riskPos: { f: string; form: string } | undefined;
    for (const { f, hits } of hitsByFile) {
      for (const h of hits) {
        const src = sources.find((s) => s.f === f)?.src ?? "";
        if (isExportedMember(src, h.pos)) {
          riskPos = { f, form: h.form };
          break;
        }
      }
      if (riskPos) break;
    }
    if (riskPos) {
      skips.push({
        plugin: pack.plugin,
        key,
        text: enText,
        reason: "位于导出对象内（可能既是显示文案又是逻辑校验值），跳过",
      });
      continue;
    }

    // 跨文件出现时语境可能不同，保守跳过
    const filesWithHit = hitsByFile.map((x) => x.f);
    if (filesWithHit.length > 1) {
      skips.push({
        plugin: pack.plugin,
        key,
        text: enText,
        reason: `在 ${filesWithHit.length} 个文件中出现，语境可能不同，跳过`,
      });
      continue;
    }

    const file = filesWithHit[0];
    for (const form of forms) {
      pairs.push({
        file,
        old: form,
        // 模板串：在闭引号前插注释，保持 ${...} 插值原样。
        // 普通字面量：双引号内直接在英文后附上中文。
        neu: templateMode
          ? form.slice(0, -1) + "（" + cleanPlaceholders(zhText) + "）`"
          : form.slice(0, 1) + enText + "（" + zhText + "）" + form.slice(-1),
      });
    }
  }

  return { pairs, skips };
}

// ---------- 对外入口 ----------

/** 扫描所有插件的语言包，生成「英文（中文）」映射（纯计算，不写盘） */
export function collectLocaleCandidates(): LocaleScanResult {
  const packs = findLocalePacks();
  const maps: Record<string, Array<[string, string]>> = {};
  const skips: LocaleSkip[] = [];
  let sourceFiles = 0;

  for (const pack of packs) {
    sourceFiles += collectSources(pack.dir).length;
    const { pairs, skips: s } = buildPairsFor(pack);
    for (const p of pairs) {
      if (!maps[p.file]) maps[p.file] = [];
      // 同文件内去重
      if (!maps[p.file].some(([o]) => o === p.old)) maps[p.file].push([p.old, p.neu]);
    }
    skips.push(...s);
  }

  return { packs, maps, skips, sourceFiles };
}

export function writeLocaleMaps(maps: Record<string, Array<[string, string]>>): void {
  fs.mkdirSync(path.dirname(LOCALE_MAP_FILE), { recursive: true });
  fs.writeFileSync(LOCALE_MAP_FILE, JSON.stringify(maps, null, 2) + "\n", "utf8");
}

export function readLocaleMaps(): Record<string, Array<[string, string]>> {
  try {
    const raw = JSON.parse(fs.readFileSync(LOCALE_MAP_FILE, "utf8"));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  } catch {
    /* 尚无语言包映射 */
  }
  return {};
}
