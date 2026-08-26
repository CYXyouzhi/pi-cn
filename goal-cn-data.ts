/**
 * pi-goal 插件界面汉化数据（goal-cn-data.ts）
 * 统一形式：英文原文保留 + 括号中文注释（和之前 plan-mode 选项一致）。
 * 给 AI 的 prompt、工具定义（goal_complete/goal_blocked/goal_wait）不在此文件。
 */

// menu-4GLAABLR.js —— /goal 菜单界面
export const GOAL_MENU_MAP: Array<[string, string]> = [
  // —— 菜单选项 label ——
  ['"Start a goal\\u2026"', '"Start a goal\\u2026（开始目标）"'],
  ['"Start with token budget\\u2026"', '"Start with token budget\\u2026（带预算开始）"'],
  ['"Pause goal"', '"Pause goal（暂停目标）"'],
  ['"Resume goal"', '"Resume goal（恢复目标）"'],
  ['"Review and continue\\u2026"', '"Review and continue\\u2026（查看并继续）"'],
  ['"Increase budget and resume\\u2026"', '"Increase budget and resume\\u2026（增加预算并恢复）"'],
  ['"Edit goal\\u2026"', '"Edit goal\\u2026（编辑目标）"'],
  ['"Replace goal\\u2026"', '"Replace goal\\u2026（替换目标）"'],
  ['"View full status"', '"View full status（查看完整状态）"'],
  ['"Settings\\u2026"', '"Settings\\u2026（设置）"'],
  ['"Help"', '"Help（帮助）"'],
  ['"Clear goal\\u2026"', '"Clear goal\\u2026（清除目标）"'],
  ['"Close"', '"Close（关闭）"'],
  ['"25k \\u2014 Lower token ceiling"', '"25k \\u2014 Lower token ceiling（较低的 token 上限）"'],
  ['"100k \\u2014 Suggested"', '"100k \\u2014 Suggested（建议值）"'],
  ['"300k \\u2014 Higher token ceiling"', '"300k \\u2014 Higher token ceiling（较高的 token 上限）"'],
  ['"Set a custom budget\\u2026"', '"Set a custom budget\\u2026（设置自定义预算）"'],
  ['"Back"', '"Back（返回）"'],
  ['"Continue \\u2014 Unlimited"', '"Continue \\u2014 Unlimited（继续 — 无限）"'],
  ['"Change automatic-work limit\\u2026"', '"Change automatic-work limit\\u2026（更改自动工作限制）"'],

  // —— 标题 ——
  ['title: "Goal"', 'title: "Goal（目标）"'],
  ['title: "Choose token budget"', 'title: "Choose token budget（选择 token 预算）"'],
  ['title: "Custom token budget"', 'title: "Custom token budget（自定义 token 预算）"'],
  ['title: "Increase token budget unavailable"', 'title: "Increase token budget unavailable（无法增加 token 预算）"'],
  ['title: "Increase token budget"', 'title: "Increase token budget（增加 token 预算）"'],
  ['title: "Automatic work paused"', 'title: "Automatic work paused（自动工作已暂停）"'],
  ['title: "Goal status"', 'title: "Goal status（目标状态）"'],
  ['title: "Goal help"', 'title: "Goal help（目标帮助）"'],

  // —— 状态文本 ——
  ['"Paused \\u2014 automatic-work limit reached"', '"Paused \\u2014 automatic-work limit reached（已暂停 — 达到自动工作限制）"'],
  ['"No goal is currently set."', '"No goal is currently set.（当前没有设置目标）"'],
  ['"No goal is currently set"', '"No goal is currently set（当前没有设置目标）"'],
  ['"No goal"', '"No goal（无目标）"'],
  ['"Usage limited"', '"Usage limited（用量受限）"'],
  ['"Budget limited"', '"Budget limited（预算受限）"'],

  // —— 说明/通知 ——
  ["Progress is saved. Review the safety limit before continuing.", "Progress is saved. Review the safety limit before continuing.（进度已保存，继续前请先查看安全限制。）"],
  ["Automatic work is configured as Unlimited.", "Automatic work is configured as Unlimited.（自动工作已配置为无限。）"],
  ["Automatic work is configured to pause after ${automaticTurnLimit} responses.", "Automatic work is configured to pause after ${automaticTurnLimit} responses.（自动工作配置为在 ${automaticTurnLimit} 次响应后暂停。）"],
  ["No larger safe whole-number token budget is available. Progress remains saved; choose Back and clear or replace the goal when ready.", "No larger safe whole-number token budget is available. Progress remains saved; choose Back and clear or replace the goal when ready.（没有更大的安全整数 token 预算可用；进度仍保存，准备好后请选择 Back 清除或替换目标。）"],
  ["The budget-limited goal is no longer available. Return to the Goal menu.", "The budget-limited goal is no longer available. Return to the Goal menu.（预算受限的目标已不可用，请返回目标菜单。）"],
  ["The objective and usage are preserved.", "The objective and usage are preserved.（目标和用量已保留。）"],
  ["Continuing resets the counter to 0 and resumes with Unlimited automatic work.", "Continuing resets the counter to 0 and resumes with Unlimited automatic work.（继续将计数器重置为 0，并以无限自动工作恢复。）"],
  ["Continuing resets the counter to 0 and allows up to ${limit} more automatic model responses.", "Continuing resets the counter to 0 and allows up to ${limit} more automatic model responses.（继续将计数器重置为 0，并允许最多 ${limit} 次自动模型响应。）"],
  ["The paused goal is no longer available. Return to the Goal menu.", "The paused goal is no longer available. Return to the Goal menu.（已暂停的目标已不可用，请返回目标菜单。）"],
  ["Set the cumulative token limit to 25k.", "Set the cumulative token limit to 25k.（将累计 token 限制设为 25k。）"],
  ["Set the cumulative token limit to 100k.", "Set the cumulative token limit to 100k.（将累计 token 限制设为 100k。）"],
  ["Set the cumulative token limit to 300k.", "Set the cumulative token limit to 300k.（将累计 token 限制设为 300k。）"],
  ["Enter an exact cumulative token limit.", "Enter an exact cumulative token limit.（输入精确的累计 token 限制。）"],
  ["Enter a positive token amount, for example 25k, 300k, or 1.5m.", "Enter a positive token amount, for example 25k, 300k, or 1.5m.（输入正数 token 数量，例如 25k、300k 或 1.5m。）"],
  ["Enter a positive token amount, for example 300k, 1.5m, or 300000.", "Enter a positive token amount, for example 300k, 1.5m, or 300000.（输入正数 token 数量，例如 300k、1.5m 或 300000。）"],
  ["Set the maximum cumulative token usage for this goal.", "Set the maximum cumulative token usage for this goal.（设置此目标的累计 token 用量上限。）"],
  ["The final model call may exceed the limit; this is not a dollar-cost cap.", "The final model call may exceed the limit; this is not a dollar-cost cap.（最后一次模型调用可能超过限制；这不是金额成本上限。）"],
  ["Enter the maximum cumulative token usage for this goal.", "Enter the maximum cumulative token usage for this goal.（输入此目标的累计 token 用量上限。）"],
  ["Examples: 25k, 300k, 1.5m, or 300000.", "Examples: 25k, 300k, 1.5m, or 300000.（示例：25k、300k、1.5m 或 300000。）"],
  ["The final model call may exceed this value; this is not a dollar-cost cap.", "The final model call may exceed this value; this is not a dollar-cost cap.（最后一次模型调用可能超过此值；这不是金额成本上限。）"],
  ["Automatic work has no response-count cap.", "Automatic work has no response-count cap.（自动工作没有响应次数上限。）"],
  ["Automatic work will also pause after ${automaticLimit} responses.", "Automatic work will also pause after ${automaticLimit} responses.（自动工作也会在 ${automaticLimit} 次响应后暂停。）"],
  ["Examples: 300k, 1.5m, or 300000.", "Examples: 300k, 1.5m, or 300000.（示例：300k、1.5m 或 300000。）"],
  ["The goal will resume immediately.", "The goal will resume immediately.（目标将立即恢复。）"],
  ["The goal changed or its usage changed while the budget dialog was open. Reopen /goal and try again.", "The goal changed or its usage changed while the budget dialog was open. Reopen /goal and try again.（预算对话框打开期间目标或其用量发生了变化，请重新打开 /goal 再试。）"],
  ["The active goal changed while the dialog was open. Reopen /goal and try again.", "The active goal changed while the dialog was open. Reopen /goal and try again.（对话框打开期间活动目标发生了变化，请重新打开 /goal 再试。）"],
  ["Goal menu", "Goal menu（目标菜单）"],
  ["Use the menu for guided status, edits, settings, and confirmations.", "Use the menu for guided status, edits, settings, and confirmations.（使用菜单进行引导式的状态查看、编辑、设置和确认。）"],
  ["Direct routes remain available for deterministic workflows:", "Direct routes remain available for deterministic workflows:（确定性工作流仍可使用直接命令：）"],
  ["Escape cancels the current menu or input without changing goal state.", "Escape cancels the current menu or input without changing goal state.（Esc 会取消当前菜单或输入，且不改变目标状态。）"],
  ["Automatic work: Unlimited after resume", "Automatic work: Unlimited after resume（自动工作：恢复后为无限）"],
  ["Automatic work: up to ${automaticLimit} more responses after resume", "Automatic work: up to ${automaticLimit} more responses after resume（自动工作：恢复后最多再 ${automaticLimit} 次响应）"],
  ["Goal: ${safeGoalMenuText(goal.text, 4e3)}", "Goal: ${safeGoalMenuText(goal.text, 4e3)}（目标）"],
  ["Current usage: ${formatTokenCount(goal.tokensUsed)}", "Current usage: ${formatTokenCount(goal.tokensUsed)}（当前用量）"],
  ["Current usage: ${formatBudgetDecisionValue(goal.tokensUsed)}", "Current usage: ${formatBudgetDecisionValue(goal.tokensUsed)}（当前用量）"],
  ["Current budget: ${formatBudgetDecisionValue(goal.tokenBudget ?? 0)}", "Current budget: ${formatBudgetDecisionValue(goal.tokenBudget ?? 0)}（当前预算）"],

  // —— 编辑器/确认框标题 ——
  ['"Goal objective"', '"Goal objective（目标内容）"'],
  ['"Edit goal objective"', '"Edit goal objective（编辑目标内容）"'],
  ['"Increase goal budget?"', '"Increase goal budget?（增加目标预算？）"'],
  ['"Apply goal edit?"', '"Apply goal edit?（应用目标编辑？）"'],
  ['"Clear goal?"', '"Clear goal?（清除目标？）"'],
];

// settings-ui-MVYTTBHW.js —— /goal 设置界面
export const GOAL_SETTINGS_MAP: Array<[string, string]> = [
  // —— 条目 label ——
  ['"Automatic-work limit"', '"Automatic-work limit（自动工作限制）"'],
  ['"No-progress guard"', '"No-progress guard（无进度保护）"'],
  ['"Managed run RPC"', '"Managed run RPC（受管运行 RPC）"'],
  ['"Set response limit\\u2026"', '"Set response limit\\u2026（设置响应限制）"'],
  ['"Unlimited\\u2026"', '"Unlimited\\u2026（无限）"'],
  ['"Set threshold\\u2026"', '"Set threshold\\u2026（设置阈值）"'],
  ['label: "Off"', 'label: "Off（关闭）"'],

  // —— 标题 ——
  ['title: "Pi Goal Settings"', 'title: "Pi Goal Settings（Pi Goal 设置）"'],
  ['title: "Pi Goal Settings \\xB7 Read only"', 'title: "Pi Goal Settings \\xB7 Read only（Pi Goal 设置 · 只读）"'],

  // —— 说明 ——
  ['User settings \\xB7 ${safeTerminalText(settingsPath)}', 'User settings \\xB7 ${safeTerminalText(settingsPath)}（用户设置）'],
  ["Pause automatic Goal work after a visible number of model responses.", "Pause automatic Goal work after a visible number of model responses.（在可见数量的模型响应后暂停自动目标工作。）"],
  ["Pause after repeated or empty tool-free automatic runs.", "Pause after repeated or empty tool-free automatic runs.（在重复或空的免工具自动运行后暂停。）"],
  ["Allow trusted installed extensions to start and cancel Goal runs; this is not an extension sandbox.", "Allow trusted installed extensions to start and cancel Goal runs; this is not an extension sandbox.（允许受信任的已安装扩展启动和取消目标运行；这不是扩展沙箱。）"],
  ["Invalid settings file. Pi-goal is using built-in defaults. Fix ${safeTerminalText(settingsPath)} and run /reload. The file will not be overwritten.", "Invalid settings file. Pi-goal is using built-in defaults. Fix ${safeTerminalText(settingsPath)} and run /reload. The file will not be overwritten.（设置文件无效，Pi-goal 正使用内置默认值；修复 ${safeTerminalText(settingsPath)} 后运行 /reload，文件不会被覆盖。）"],
  ["Set a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.", "Set a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.（为每个自动工作时段设置整数响应限制，默认：${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}。）"],
  ["No response-count cap. Completion, manual pause, blockers, provider limits, and other configured guards still apply.", "No response-count cap. Completion, manual pause, blockers, provider limits, and other configured guards still apply.（无响应次数上限；完成、手动暂停、阻塞、提供商限制及其他已配置的保护仍然生效。）"],
  ["Choose a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.", "Choose a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.（为每个自动工作时段选择整数响应限制，默认：${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}。）"],
  ["Pause after the default number of repeated or empty tool-free runs.", "Pause after the default number of repeated or empty tool-free runs.（在默认次数的重复或空的免工具运行后暂停。）"],
  ["Choose a whole number of repeated or empty runs before pausing.", "Choose a whole number of repeated or empty runs before pausing.（选择暂停前的重复或空运行整数次数。）"],
  ["Do not pause based on repeated or empty tool-free runs.", "Do not pause based on repeated or empty tool-free runs.（不基于重复或空的免工具运行暂停。）"],
  ["The active goal changed while the safety setting was open. No settings were changed.", "The active goal changed while the safety setting was open. No settings were changed.（安全设置打开期间活动目标发生了变化，未更改任何设置。）"],
  ["The active goal changed while editing the safety setting. No settings were changed.", "The active goal changed while editing the safety setting. No settings were changed.（编辑安全设置期间活动目标发生了变化，未更改任何设置。）"],
  ["The active goal changed while confirming the limit. No settings were changed.", "The active goal changed while confirming the limit. No settings were changed.（确认限制期间活动目标发生了变化，未更改任何设置。）"],
  ["Tool loops can continue without a response-count limit and may consume substantial tokens and provider cost. Completion, manual pause, blockers, provider limits, and the no-progress guard still apply.", "Tool loops can continue without a response-count limit and may consume substantial tokens and provider cost. Completion, manual pause, blockers, provider limits, and the no-progress guard still apply.（工具循环可在无响应次数限制的情况下继续，可能消耗大量 token 和提供商费用；完成、手动暂停、阻塞、提供商限制和无进度保护仍然生效。）"],
  ["The active goal has already used ${used}. Setting this limit to ${limit} will pause it immediately without deleting progress.", "The active goal has already used ${used}. Setting this limit to ${limit} will pause it immediately without deleting progress.（活动目标已使用 ${used}，将此限制设为 ${limit} 会立即暂停它且不删除进度。）"],

  // —— 编辑器/确认框标题 ——
  ['"Allow Unlimited automatic work?"', '"Allow Unlimited automatic work?（允许无限自动工作？）"'],
  ['"Apply limit and pause now?"', '"Apply limit and pause now?（应用限制并立即暂停？）"'],
  ['"Repeated-run threshold (whole number greater than 0)"', '"Repeated-run threshold (whole number greater than 0)（重复运行阈值，大于 0 的整数）"'],
  ['"Positive whole number"', '"Positive whole number（正整数）"'],
];

// chunk-XHEFHXTF.js —— 核心逻辑中的通知/命令帮助（仅用户可见部分）
export const GOAL_CORE_MAP: Array<[string, string]> = [
  // —— /goal 子命令描述 ——
  ["Set a token budget before the goal", "Set a token budget before the goal（开始目标前设置 token 预算）"],
  ["Pause the active goal", "Pause the active goal（暂停活动目标）"],
  ["Resume a stopped or budget-limited goal", "Resume a stopped or budget-limited goal（恢复已停止或预算受限的目标）"],
  ["Clear the current goal", "Clear the current goal（清除当前目标）"],
  ["Edit the current goal objective", "Edit the current goal objective（编辑当前目标内容）"],
  ["Show the current goal", "Show the current goal（显示当前目标）"],
  ["Set a token budget before the updated goal", "Set a token budget before the updated goal（更新目标前设置 token 预算）"],

  // —— usage 帮助前缀 ——
  ["Usage: ", "用法："],

  // —— 通知（用户可见）——
  ["Invalid token budget: ${rawBudget}", "Invalid token budget: ${rawBudget}（无效的 token 预算）"],
  ["Goal objective is too long (${trimmed.length}/${MAX_OBJECTIVE_LENGTH} characters). Put long instructions in a file and reference it from /goal instead.", "Goal objective is too long (${trimmed.length}/${MAX_OBJECTIVE_LENGTH} characters). Put long instructions in a file and reference it from /goal instead.（目标内容过长；请把长指令放到文件里，再从 /goal 引用。）"],
  ["Goal session replaced", "Goal session replaced（目标会话已替换）"],
  ["Goal session shut down", "Goal session shut down（目标会话已关闭）"],
  ["Goal prompt failed: ${formatError(error)}", "Goal prompt failed: ${formatError(error)}（目标提示失败）"],
  ["Goal wait deadline failed: ${formatError(error)}", "Goal wait deadline failed: ${formatError(error)}（目标等待期限失败）"],
  ["Goal budget wrap-up failed: ${formatError(error)}", "Goal budget wrap-up failed: ${formatError(error)}（目标预算收尾失败）"],
  ["Goal token budget reached: ${formatBudget2(stoppedGoal)}", "Goal token budget reached: ${formatBudget2(stoppedGoal)}（已达到目标 token 预算）"],
  ["Automatic-work limit reached: ${stoppedGoal.automaticModelTurns} of ${automaticLimit} responses. Goal progress is saved with ${formatTokenCount(stoppedGoal.tokensUsed)} cumulative tokens. Open /goal to review and continue.", "Automatic-work limit reached: ${stoppedGoal.automaticModelTurns} of ${automaticLimit} responses. Goal progress is saved with ${formatTokenCount(stoppedGoal.tokensUsed)} cumulative tokens. Open /goal to review and continue.（已达到自动工作限制；进度已保存，打开 /goal 查看并继续。）"],
  ["Goal paused: ${count}; ${formatTokenCount(stoppedGoal.tokensUsed)} cumulative tokens. Open /goal to review and continue.", "Goal paused: ${count}; ${formatTokenCount(stoppedGoal.tokensUsed)} cumulative tokens. Open /goal to review and continue.（目标已暂停；打开 /goal 查看并继续。）"],
  ["Goal waiting after provider retries were exhausted${details}. Send a follow-up or run /goal resume to retry.", "Goal waiting after provider retries were exhausted${details}. Send a follow-up or run /goal resume to retry.（提供商重试耗尽后目标等待中；发送后续消息或运行 /goal resume 重试。）"],
  ["Goal blocked after agent error retries were exhausted${details}. Resolve the blocker or run /goal resume to retry.", "Goal blocked after agent error retries were exhausted${details}. Resolve the blocker or run /goal resume to retry.（代理错误重试耗尽后目标被阻塞；解决阻塞或运行 /goal resume 重试。）"],
  ["Goal tools are unavailable, so the active goal was paused. Restore the tools and run /goal resume.", "Goal tools are unavailable, so the active goal was paused. Restore the tools and run /goal resume.（目标工具不可用，活动目标已暂停；恢复工具后运行 /goal resume。）"],
  ["goal cleared", "goal cleared（目标已清除）"],

  // —— 状态片段 ——
  ["automatic Unlimited", "automatic Unlimited（自动：无限）"],
  ["queued \\xB7 ${automatic}", "queued \\xB7 ${automatic}（排队中）"],
  ["blocked \\xB7 ${automatic}", "blocked \\xB7 ${automatic}（已阻塞）"],
  ["usage \\xB7 ${automatic}", "usage \\xB7 ${automatic}（用量受限）"],
  ["paused \\xB7 ${automatic}", "paused \\xB7 ${automatic}（已暂停）"],
  ["active ${formatDuration(goal.timeUsedSeconds)} \\xB7 ${automatic}", "active ${formatDuration(goal.timeUsedSeconds)} \\xB7 ${automatic}（进行中）"],
  ["Goal: ${goal.text}", "Goal: ${goal.text}（目标）"],
  ["Iteration: ${goal.iteration}", "Iteration: ${goal.iteration}（迭代次数）"],
  ["Active elapsed: ${formatDuration(goal.timeUsedSeconds)}", "Active elapsed: ${formatDuration(goal.timeUsedSeconds)}（已用时）"],
  ["Safety pause: no progress. Progress is saved; open /goal to review and continue.", "Safety pause: no progress. Progress is saved; open /goal to review and continue.（安全暂停：无进展；进度已保存，打开 /goal 查看并继续。）"],
];

// dist/index.ts —— 命令描述 + 通知（仅用户可见部分，工具定义为 AI 内容不在此）
export const GOAL_INDEX_MAP: Array<[string, string]> = [
  ["Run a goal to completion: /goal [--tokens 100k] <goal_to_complete>", "Run a goal to completion: /goal [--tokens 100k] <goal_to_complete>（运行目标直至完成）"],
  ["Replace goal?", "Replace goal?（替换目标？）"],
  ["Goal kept: ${existingGoal.text}", "Goal kept: ${existingGoal.text}（目标已保留）"],
  ["The active goal changed while confirmation was open. Try again.", "The active goal changed while confirmation was open. Try again.（确认期间活动目标发生了变化，请重试。）"],
  ["Cannot start /goal: ${formatError(error)}", "Cannot start /goal: ${formatError(error)}（无法启动 /goal）"],
  ["No active goal.", "No active goal.（没有活动目标。）"],
  ["Goal paused: ${stoppedGoal.text}", "Goal paused: ${stoppedGoal.text}（目标已暂停）"],
  ["Goal token budget is still reached: ${formatBudget(this.runtime.activeGoal)}", "Goal token budget is still reached: ${formatBudget(this.runtime.activeGoal)}（目标 token 预算仍未恢复）"],
  ["Cannot resume /goal: ${formatError(error)}", "Cannot resume /goal: ${formatError(error)}（无法恢复 /goal）"],
  ["Goal resumed from waiting: ${waitingGoal.text}", "Goal resumed from waiting: ${waitingGoal.text}（目标已从等待中恢复）"],
  ["Removed legacy ordered goal queue state.", "Removed legacy ordered goal queue state.（已移除旧的有序目标队列状态。）"],
  ["Goal cleared: ${stoppedGoal}", "Goal cleared: ${stoppedGoal}（目标已清除）"],
  ["No active goal. Use /goal <objective> to start one.", "No active goal. Use /goal <objective> to start one.（没有活动目标，使用 /goal <目标> 开始一个。）"],
  ["Cannot reactivate /goal: ${formatError(error)}", "Cannot reactivate /goal: ${formatError(error)}（无法重新激活 /goal）"],
  ["Goal updated: ${objective}", "Goal updated: ${objective}（目标已更新）"],
  ["Another workflow is active in this session. End it before starting Goal.", "Another workflow is active in this session. End it before starting Goal.（本会话中已有其他工作流在运行，请先结束再启动目标。）"],
  ["Ordered goal queue has been removed.", "Ordered goal queue has been removed.（有序目标队列已移除。）"],
  ["Example objective: \"task b is complete; do task a next, then task c and task d.\"", "Example objective: \"task b is complete; do task a next, then task c and task d.\"（示例目标：任务 b 已完成，接下来做任务 a，然后是任务 c 和任务 d。）"],
  ["pi-goal settings ignored: ${settingsResult.reason}. Using default settings.", "pi-goal settings ignored: ${settingsResult.reason}. Using default settings.（pi-goal 设置被忽略，使用默认设置。）"],
  ["Goal paused after interruption${details}. Run /goal resume to continue.", "Goal paused after interruption${details}. Run /goal resume to continue.（目标中断后已暂停，运行 /goal resume 继续。）"],
  ["Goal stopped after provider usage limit${details}. Run /goal resume when usage is available.", "Goal stopped after provider usage limit${details}. Run /goal resume when usage is available.（提供商用量受限后目标已停止，用量可用时运行 /goal resume。）"],
  ["Goal blocked after agent error${details}. Resolve the blocker or run /goal resume to retry.", "Goal blocked after agent error${details}. Resolve the blocker or run /goal resume to retry.（代理出错后目标已阻塞，解决阻塞或运行 /goal resume 重试。）"],
];
