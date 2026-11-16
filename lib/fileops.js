/**
 * Pure helpers behind the in-app editor: name validation, archive destinations,
 * new-skill templates and document sanity checks.
 *
 * They are shared by the host (which enforces them before touching disk) and by
 * the tests; the browser half carries small copies for instant feedback.
 */

/** Largest document the editor accepts, in bytes. */
export const MAX_DOCUMENT_BYTES = 256 * 1024

/** kebab-case skill name the catalog can address. */
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/

/**
 * Validate a directory name for a new skill.
 * @param {string} name - candidate name.
 * @returns {{ ok: boolean, name: string, error?: string }} normalized name or a reason.
 */
export function validateSkillName(name) {
  const value = String(name ?? '').trim()
  if (value === '') return { ok: false, name: value, error: 'name is empty' }
  if (!NAME_PATTERN.test(value)) return { ok: false, name: value, error: 'use kebab-case: lowercase letters, digits and dashes, 2-64 characters' }
  return { ok: true, name: value }
}

/**
 * Build the archive destination for a skill.
 * @param {string} root - the skill root the entry lives in.
 * @param {string} name - skill directory or file name without `.md`.
 * @param {Date} now - clock, injected for tests.
 * @returns {{ dir: string, stamp: string }} directory to move into, inside `<root>/.archive`.
 */
export function archiveDestination(root, name, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')
  return { dir: `${root}\\.archive\\${name}-${stamp}`, stamp }
}

/**
 * Render a new skill document.
 * @param {string} name - validated skill name.
 * @param {string} description - one-line trigger description.
 * @returns {string} a complete SKILL.md body with frontmatter.
 */
export function templateSkill(name, description) {
  const summary = String(description ?? '').trim() || `Use when a task matches ${name}.`
  return [
    '---',
    `name: ${name}`,
    `description: ${summary.replace(/\n+/g, ' ')}`,
    '---',
    '',
    `# ${name}`,
    '',
    '## When to use it',
    '',
    '- ',
    '',
    '## Steps',
    '',
    '1. ',
    '',
    '## Checks',
    '',
    '- [ ] ',
    '',
  ].join('\n')
}

/**
 * Check that a document still looks like a skill instruction file.
 * @param {string} text - editor content.
 * @returns {{ ok: boolean, problems: string[], modeRemoved: boolean, size: number }} findings.
 */
export function inspectDraft(text) {
  const value = String(text ?? '')
  const problems = []
  const size = Buffer.byteLength(value, 'utf8')
  if (size > MAX_DOCUMENT_BYTES) problems.push(`document is larger than ${Math.round(MAX_DOCUMENT_BYTES / 1024)} KB`)
  if (!/^---\r?\n/.test(value)) problems.push('the document must start with a frontmatter block (---)')
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(value)
  if (front === null) {
    problems.push('the frontmatter block is not closed with ---')
  } else {
    const body = front[1]
    if (!/^name:\s*\S+/m.test(body)) problems.push('frontmatter needs a name')
    if (!/^description:\s*\S+/m.test(body)) problems.push('frontmatter needs a description')
    const description = /^description:\s*(.+)$/m.exec(body)
    if (description !== null && description[1].length > 500) problems.push('the description is longer than 500 characters and will be truncated in the model catalog')
  }
  const modeRemoved = !/disable-model-invocation|user-invocable/.test(value)
  return { ok: problems.length === 0, problems, modeRemoved, size }
}

/**
 * Decide what a write request may touch.
 * @param {{ path?: string, baseMtimeMs?: number }} request - incoming request.
 * @param {number} currentMtimeMs - mtime the file has right now (0 when missing).
 * @returns {{ ok: boolean, conflict: boolean, error?: string }} whether the write may proceed.
 */
export function checkWritePreconditions(request, currentMtimeMs) {
  if (typeof request?.path !== 'string' || request.path === '') return { ok: false, conflict: false, error: 'path is required' }
  const base = Number(request.baseMtimeMs ?? 0)
  if (base > 0 && Math.round(Number(currentMtimeMs ?? 0)) !== Math.round(base)) {
    return { ok: false, conflict: true, error: 'the file changed on disk since it was opened; reload before saving' }
  }
  return { ok: true, conflict: false }
}
