/**
 * Drafts the plugin hands to the composer for the "let the agent do it" path.
 * The UI never writes skill files itself: it prepares a precise request and the
 * user decides whether to send it.
 */

/**
 * @param {{ name?: string, path?: string, mode?: string }} row - the skill being edited.
 * @returns {string} a ready-to-send edit request.
 */
export function draftEdit(row) {
  const name = row?.name || 'skill'
  const path = row?.path || ''
  return [
    `请修改技能 \`${name}\`（${path}）：`,
    '',
    '- 要改什么：',
    '- 为什么：',
    '',
    '改完请保留 frontmatter 里现有的调用开关（disable-model-invocation / user-invocable），并把 description 控制在 500 字符以内，最后给我改动摘要。',
  ].join('\n')
}

/**
 * @param {{ name?: string, path?: string }} row - the skill being retired.
 * @returns {string} a ready-to-send archive request.
 */
export function draftArchive(row) {
  const name = row?.name || 'skill'
  const path = row?.path || ''
  return [
    `请归档技能 \`${name}\`（${path}）：`,
    '',
    `1. 把它整体移动到同根目录下的 .archive/${name}-<时间戳>/；`,
    '2. 确认技能目录里已经看不到它；',
    '3. 告诉我归档后的路径，方便我以后恢复。',
  ].join('\n')
}

/**
 * @param {{ rootLabel?: string }} options - where the new skill should live.
 * @returns {string} a ready-to-send creation request.
 */
export function draftCreate(options = {}) {
  const root = options.rootLabel || '~/.dsh/skills/<名称>/SKILL.md'
  return [
    '请新建一个技能：',
    '',
    '- 名称（kebab-case）：',
    '- 什么时候该用它（触发场景）：',
    `- 放哪里：${root}`,
    '',
    'frontmatter 至少包含 name 和 description（description 用 "Use when…" 句式写清触发场景，控制在 500 字符以内），正文写清楚步骤、检查项与验证方法。',
  ].join('\n')
}
