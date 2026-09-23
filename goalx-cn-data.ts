/**
 * pi-goal-x 插件界面汉化数据（goalx-cn-data.ts）
 *
 * 目标包：~/.pi/agent/npm/node_modules/pi-goal-x/extensions/*.ts（TS 源码直接加载）
 * 统一采用"英文原文 + 括号中文注释"形式，全部使用带引号的完整字面量替换，
 * 避免裸字符串误伤子串（如 "Goal is complete." 误匹配 "Goal is completed."）。
 *
 * 不翻译的内容：
 *  - 工具定义给 AI 的 prompt / description（AI 可见内容）
 *  - 以冒号或空格结尾、后续拼接变量的半截句子（注释位置会错乱）
 *  - goal-widget.ts 中的示例任务名（演示数据，非界面文字）
 */

export const GOAL_X_MAPS: Record<string, Array<[string, string]>> = {
  "auditor-selector.ts": [
    ['"✎ Enter provider/model manually (advanced)"', '"✎ Enter provider/model manually (advanced)（手动输入提供商/模型）"'],
  ],

  "goal-commands.ts": [
    // —— 设置条目 label ——
    ['"autonomous run allowance"', '"autonomous run allowance（自动运行配额）"'],
    ['"stall timeout (minutes)"', '"stall timeout (minutes)（停滞超时·分钟）"'],
    ['"max objective length (0 = none)"', '"max objective length (0 = none)（目标最大长度，0 为不限）"'],
    ['"auditor disabled"', '"auditor disabled（禁用审计器）"'],
    ['"oracle enabled"', '"oracle enabled（启用 Oracle）"'],
    ['"oracle provider/model"', '"oracle provider/model（Oracle 提供商/模型）"'],
    ['"oracle thinking_level"', '"oracle thinking_level（Oracle 思考级别）"'],
    ['"oracle project resources"', '"oracle project resources（Oracle 项目资源）"'],
    ['"max failed attempts per blocker"', '"max failed attempts per blocker（每个阻塞的最大失败尝试次数）"'],

    // —— 通知 / 提示 ——
    ['"Goal focus unchanged."', '"Goal focus unchanged.（目标焦点未变。）"'],
    ['"No open goals. Use /goal to draft one, or /goal-direct <objective> to start immediately."', '"No open goals. Use /goal to draft one, or /goal-direct <objective> to start immediately.（没有进行中的目标。用 /goal 起草一个，或用 /goal-direct <目标> 立即开始。）"'],
    ['"A Sisyphus objective needs ordered steps with per-step done criteria. Use /sisyphus for guided drafting, or provide numbered steps (1) ..., 2) ...) in the objective."', '"A Sisyphus objective needs ordered steps with per-step done criteria. Use /sisyphus for guided drafting, or provide numbered steps (1) ..., 2) ...) in the objective.（Sisyphus 目标需要有序步骤和每步完成标准。用 /sisyphus 引导起草，或在目标中提供编号步骤 1) ...、2) ...。）"'],
    ['"goal-recovery repair: cancelled — nothing changed."', '"goal-recovery repair: cancelled — nothing changed.（goal-recovery 修复：已取消，未做任何更改。）"'],
    ['"No goal is set."', '"No goal is set.（未设置目标。）"'],
    ['"Goal is complete."', '"Goal is complete.（目标已完成。）"'],
    ['"Goal is already paused. Use /goal-resume to continue."', '"Goal is already paused. Use /goal-resume to continue.（目标已暂停。用 /goal-resume 继续。）"'],
    ['"No goal is focused."', '"No goal is focused.（当前没有聚焦的目标。）"'],
    ['"Goal resumed; autonomous allowance renewed."', '"Goal resumed; autonomous allowance renewed.（目标已恢复；自动运行配额已重置。）"'],
    ['"Goal clear cancelled."', '"Goal clear cancelled.（已取消清除目标。）"'],
    ['"Goal changed while confirming; nothing was cleared."', '"Goal changed while confirming; nothing was cleared.（确认期间目标已变化，未清除任何内容。）"'],
    ['"No goal is set. Use /goal to draft one, or /goal-direct <objective> to create one immediately."', '"No goal is set. Use /goal to draft one, or /goal-direct <objective> to create one immediately.（未设置目标。用 /goal 起草一个，或用 /goal-direct <目标> 立即创建。）"'],
    ['"Goal is complete. Use /goal to draft a new one, or /goal-direct <objective> to create one immediately."', '"Goal is complete. Use /goal to draft a new one, or /goal-direct <objective> to create one immediately.（目标已完成。用 /goal 起草新目标，或用 /goal-direct <目标> 立即创建。）"'],
    ['"Provide the replacement objective: /goal-tweak <new objective>"', '"Provide the replacement objective: /goal-tweak <new objective>（请提供替换后的目标：/goal-tweak <新目标>）"'],
    ['"No active draft to cancel."', '"No active draft to cancel.（没有可取消的草稿。）"'],
    ['"Draft cancelled; no goal was created. The execution profile is restored."', '"Draft cancelled; no goal was created. The execution profile is restored.（草稿已取消，未创建目标。执行配置已恢复。）"'],

    // —— 确认框 / 选择器 ——
    ['"Clear goal?"', '"Clear goal?（清除目标？）"'],
    ['"Filter auditor models (provider/id/name; blank = all)"', '"Filter auditor models (provider/id/name; blank = all)（过滤审计器模型 provider/id/name，留空=全部）"'],
    ['"Set auditor provider/model"', '"Set auditor provider/model（设置审计器提供商/模型）"'],
    ['"Focus open goal"', '"Focus open goal（聚焦进行中的目标）"'],
    ['"Goal settings"', '"Goal settings（目标设置）"'],
    ['"Select auditor model"', '"Select auditor model（选择审计器模型）"'],
  ],

  "goal-core-tools.ts": [
    ['label: "Get Goal"', 'label: "Get Goal（获取目标）"'],
    ['label: "Create Goal"', 'label: "Create Goal（创建目标）"'],
    ['label: "Update Goal"', 'label: "Update Goal（更新目标）"'],
  ],

  "goal-drafting.ts": [
    // "Replacing the active draft with a new " 与 "Could not start " 为拼接半截句，跳过
    ['"Ask Drafting Question"', '"Ask Drafting Question（提出起草问题）"'],
    ['"Run Drafting Questionnaire"', '"Run Drafting Questionnaire（运行起草问卷）"'],
    ['"Propose Goal Draft"', '"Propose Goal Draft（提交目标草稿）"'],
    ['"The goal tweak draft is stale (its target goal changed); it was discarded."', '"The goal tweak draft is stale (its target goal changed); it was discarded.（目标微调草稿已过期（对应目标已变化），已被丢弃。）"'],
    ['"A draft is already active; resuming it. Use /goal-cancel to discard it."', '"A draft is already active; resuming it. Use /goal-cancel to discard it.（已有草稿在进行中，将恢复该草稿。用 /goal-cancel 可丢弃。）"'],
    ['"Draft start cancelled; the existing draft stays active."', '"Draft start cancelled; the existing draft stays active.（已取消新草稿，保留现有草稿。）"'],
  ],

  "goal-events.ts": [
    ['"Provider network errors persisted after all recovery attempts. The goal remains active; resume it when the provider is healthy."', '"Provider network errors persisted after all recovery attempts. The goal remains active; resume it when the provider is healthy.（提供商网络错误在所有恢复尝试后仍存在。目标仍保持活动，待提供商恢复后再继续。）"'],
    ['"Resume paused goal?"', '"Resume paused goal?（恢复已暂停的目标？）"'],
    ['"Focus open goal"', '"Focus open goal（聚焦进行中的目标）"'],
  ],

  "goal-oracle.ts": [
    ['"Submit Oracle Advice"', '"Submit Oracle Advice（提交 Oracle 建议）"'],
  ],

  "goal-questionnaire.ts": [
    ['"Write your own answer..."', '"Write your own answer...（自定义回答...）"'],
  ],

  "goal-scheduler.ts": [
    ['"Goal owned by another session. Use /goal-resume to take ownership."', '"Goal owned by another session. Use /goal-resume to take ownership.（目标由另一个会话持有。用 /goal-resume 接管。）"'],
  ],

  "goal-settings.ts": [
    ['"auditor disabled"', '"auditor disabled（禁用审计器）"'],
    ['"auditor project resources"', '"auditor project resources（审计器项目资源）"'],
    ['"hide unfocused banner"', '"hide unfocused banner（隐藏未聚焦横幅）"'],
    ['"autonomous run allowance"', '"autonomous run allowance（自动运行配额）"'],
    ['"stall timeout (minutes)"', '"stall timeout (minutes)（停滞超时·分钟）"'],
    ['"max objective length (0 = none)"', '"max objective length (0 = none)（目标最大长度，0 为不限）"'],
    ['"network recovery attempts (0 = unbounded)"', '"network recovery attempts (0 = unbounded)（网络恢复尝试次数，0 为不限）"'],
    ['"network recovery max delay (ms)"', '"network recovery max delay (ms)（网络恢复最大延迟 ms）"'],
    ['"dashboard keybindings"', '"dashboard keybindings（仪表盘快捷键）"'],
  ],

  "goal-state.ts": [
    // "Could not toggle the auditor: " 为拼接半截句，跳过
    ['"Goal paused."', '"Goal paused.（目标已暂停。）"'],
    ['"No focused goal to toggle the auditor for."', '"No focused goal to toggle the auditor for.（当前没有可切换审计器的聚焦目标。）"'],
    ['"This goal is complete; the auditor no longer applies."', '"This goal is complete; the auditor no longer applies.（目标已完成，审计器不再适用。）"'],
  ],

  "goal-status.ts": [
    ['"Goal file"', '"Goal file（目标文件）"'],
  ],

  "goal-task-confirmation.ts": [
    // 该字符串同时用于选项值与比较，替换后两边一致，逻辑不受影响
    ['"Confirm task list"', '"Confirm task list（确认任务列表）"'],
    ['"Keep current tasks"', '"Keep current tasks（保留当前任务）"'],
  ],

  "goal-task-tools.ts": [
    ['label: "Set Goal Tasks"', 'label: "Set Goal Tasks（设置目标任务）"'],
    ['label: "Update Goal Task"', 'label: "Update Goal Task（更新目标任务）"'],
  ],

  "goal-widget.ts": [
    // 示例任务名（演示注入数据）不翻译
    ['"Checking test results..."', '"Checking test results...（正在检查测试结果...）"'],
    ['"Verifying requirements..."', '"Verifying requirements...（正在验证需求...）"'],
    ['"Evaluating completion criteria..."', '"Evaluating completion criteria...（正在评估完成标准...）"'],
    ['"Writing audit report..."', '"Writing audit report...（正在撰写审计报告...）"'],
    ['"Audit complete"', '"Audit complete（审计完成）"'],
    ['"Debug goal removed"', '"Debug goal removed（已移除调试目标）"'],
    ['"No goal to inject tasks into; create one first (Ctrl+Shift+N)"', '"No goal to inject tasks into; create one first (Ctrl+Shift+N)（没有可注入任务的目标；请先用 Ctrl+Shift+N 创建目标）"'],
    ['"Sample tasks injected (3 tasks, 1 completed)"', '"Sample tasks injected (3 tasks, 1 completed)（已注入示例任务：3 个任务，1 个已完成）"'],
  ],
};

export const GOAL_X_PAIR_COUNT = Object.values(GOAL_X_MAPS).reduce((n, p) => n + p.length, 0);
