/**
 * pi-btw 插件界面汉化数据（btw-cn-data.ts）
 * 统一形式：英文原文保留 + 括号中文注释（紧凑的底部按键提示直接中文化）。
 * 给 AI 的 prompt（<side_question> 等注入文本）不在此文件。
 */

export const BTW_MAP: Array<[string, string]> = [
  // —— 菜单标题 ——
  ['title: "Pi BTW"', 'title: "Pi BTW（Pi 侧线程）"'],
  ['title: "Resume BTW side thread"', 'title: "Resume BTW side thread（恢复 BTW 侧线程）"'],
  ['title: "Pi BTW Settings"', 'title: "Pi BTW Settings（Pi BTW 设置）"'],
  ['title: "Pi BTW Settings \\xB7 Read only"', 'title: "Pi BTW Settings \\xB7 Read only（Pi BTW 设置 · 只读）"'],

  // —— 菜单选项 label ——
  ['"Start side thread"', '"Start side thread（开始侧线程）"'],
  ['"Start from main thread tree\\u2026"', '"Start from main thread tree\\u2026（从主线程树开始）"'],
  ['"Resume side thread"', '"Resume side thread（恢复侧线程）"'],
  ['"Thinking level"', '"Thinking level（思考级别）"'],
  ['"Remember thinking level changes"', '"Remember thinking level changes（记住思考级别更改）"'],
  ['"Same as main thread"', '"Same as main thread（与主线程相同）"'],

  // —— 菜单说明 ——
  ["Open an empty side thread", "Open an empty side thread（打开空的侧线程）"],
  ["Choose context without switching the main branch", "Choose context without switching the main branch（选择上下文而不切换主分支）"],
  ["Continue an in-memory side thread", "Continue an in-memory side thread（继续内存中的侧线程）"],
  ["Choose pi-btw thinking level and fixed-level shortcut memory", "Choose pi-btw thinking level and fixed-level shortcut memory（选择 pi-btw 思考级别和固定级别快捷键记忆）"],
  ["Set the starting level for future pi-btw side threads. Currently ${currentMainThinkingLevel}.", "Set the starting level for future pi-btw side threads. Currently ${currentMainThinkingLevel}.（设置未来 pi-btw 侧线程的起始级别，当前：${currentMainThinkingLevel}。）"],
  ["Save shortcut changes for fixed thinking levels to pi-btw.json.", "Save shortcut changes for fixed thinking levels to pi-btw.json.（将固定思考级别的快捷键更改保存到 pi-btw.json。）"],
  ['User settings \\xB7 ${displaySettingsPath}', 'User settings \\xB7 ${displaySettingsPath}（用户设置）'],

  // —— 设置界面通知 ——
  ["Invalid settings file. Fix ${displaySettingsPath} before saving.", "Invalid settings file. Fix ${displaySettingsPath} before saving.（设置文件无效，保存前请修复 ${displaySettingsPath}。）"],
  ["The settings file is invalid.", "The settings file is invalid.（设置文件无效。）"],
  ["Pi BTW thinking level: ${value}.", "Pi BTW thinking level: ${value}.（Pi BTW 思考级别）"],
  ["Remember thinking level changes: ${value}.", "Remember thinking level changes: ${value}.（记住思考级别更改）"],
  ["Pi BTW settings were not saved; the previous value remains active: ${formatError3(error)}", "Pi BTW settings were not saved; the previous value remains active: ${formatError3(error)}（Pi BTW 设置未保存，仍使用之前的值）"],

  // —— 树选择器 ——
  ["No main-thread entries are available", "No main-thread entries are available（没有可用的主线程条目）"],
  ["Selected entry has no text to copy", "Selected entry has no text to copy（所选条目没有可复制的文本）"],
  ["Copied selected message", "Copied selected message（已复制所选消息）"],
  ["Could not copy selected message: ${formatError4(error)}", "Could not copy selected message: ${formatError4(error)}（无法复制所选消息）"],

  // —— 编辑器提示 ——
  ['"Question cannot be empty"', '"Question cannot be empty（问题不能为空）"'],

  // —— 命令描述 ——
  ['"Untitled side thread"', '"Untitled side thread（未命名侧线程）"'],
  ["Ask a quick side question without adding it to the main conversation", "Ask a quick side question without adding it to the main conversation（快速提出侧边问题，不加入主对话）"],
  ["/btw requires interactive TUI mode", "/btw requires interactive TUI mode（/btw 需要交互式 TUI 模式）"],
  ["Resolving /btw model credentials...", "Resolving /btw model credentials...（正在解析 /btw 模型凭据...）"],

  // —— bring 菜单 ——
  ['"Bring what back to the main thread?"', '"Bring what back to the main thread?（把什么带回主线程？）"'],
  ['"Start from which question?"', '"Start from which question?（从哪个问题开始？）"'],
  ["The main editor already has a draft", "The main editor already has a draft（主编辑器已有草稿）"],
  ["Brought ${describeContent()} to the main editor. Review and submit when ready.", "Brought ${describeContent()} to the main editor. Review and submit when ready.（已带回主编辑器，确认后提交。）"],
  ["Appended ${describeContent()} to the existing main-editor draft. Review and submit when ready.", "Appended ${describeContent()} to the existing main-editor draft. Review and submit when ready.（已追加到现有主编辑器草稿，确认后提交。）"],
  ["Replaced the main-editor draft with ${describeContent()}. Review and submit when ready.", "Replaced the main-editor draft with ${describeContent()}. Review and submit when ready.（已替换主编辑器草稿，确认后提交。）"],

  // —— 底部按键提示（紧凑，直接中文化）——
  ["btw \\u2022 Enter send \\u2022 Ctrl+R bring to main \\u2022 Ctrl+C exit", "btw · Enter 发送 · Ctrl+R 带回主线程 · Ctrl+C 退出"],
  ["btw \\u2022 Enter send \\u2022 Ctrl+C exit", "btw · Enter 发送 · Ctrl+C 退出"],
  ["Enter steer \\u2022 Ctrl+C cancel", "Enter 转向 · Ctrl+C 取消"],
  ["Ctrl+C cancel", "Ctrl+C 取消"],
  ["Empty \\u2022 Ctrl+C", "空 · Ctrl+C"],
  ['"Selected: none"', '"Selected: none（已选：无）"'],
  ["Select text to bring to main", "Select text to bring to main（选择要带回主线程的文本）"],
  ["Select text first", "Select text first（请先选择文本）"],
];
