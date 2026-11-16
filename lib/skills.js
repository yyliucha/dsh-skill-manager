/**
 * Pure skill-file helpers: frontmatter parsing, invocation-flag projection, and
 * the mode <-> flag mapping the manager exposes.
 *
 * Modes:
 * - `on`   — model and user may both invoke (no restriction keys in frontmatter).
 * - `user` — only the user may invoke (`disable-model-invocation: true`).
 * - `off`  — neither surface lists it (`disable-model-invocation: true` + `user-invocable: false`).
 */

/** Every mode the manager accepts, in display order. */
export const MODES = ['on', 'user', 'off']

/** Frontmatter keys the manager owns. */
const DISABLE_MODEL = 'disable-model-invocation'
const USER_INVOCABLE = 'user-invocable'

/**
 * Split a skill document into its YAML frontmatter block and the remaining body.
 * @param {string} text - whole file text.
 * @returns {{ newline: string, header: string[], body: string[], trailing: string } | undefined}
 *   the split document, or undefined when the file has no leading `---` block.
 */
export function splitDocument(text) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  if (lines[0] === undefined || lines[0].trim() !== '---') return undefined
  let end = -1
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      end = index
      break
    }
  }
  if (end < 0) return undefined
  return {
    newline,
    header: lines.slice(1, end),
    body: lines.slice(end + 1),
    trailing: lines.slice(end).join(newline),
  }
}

/**
 * Read the manager-relevant frontmatter fields of one header block.
 * @param {string[]} header - frontmatter lines between the delimiters.
 * @returns {{ mode: 'on' | 'user' | 'off', disableModelInvocation: boolean, userInvocable: boolean, name?: string, description?: string }}
 *   the projected flags; absent keys keep their documented defaults.
 */
export function readFlags(header) {
  let disableModelInvocation = false
  let userInvocable = true
  let name
  let description
  for (const line of header) {
    const match = /^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/.exec(line)
    if (match === null) continue
    const key = match[1]
    const raw = match[2].trim().replace(/^['"]|['"]$/g, '')
    if (key === DISABLE_MODEL) disableModelInvocation = raw === 'true'
    else if (key === USER_INVOCABLE) userInvocable = raw !== 'false'
    else if (key === 'name') name = raw
    else if (key === 'description') description = raw
  }
  const mode = disableModelInvocation ? (userInvocable ? 'user' : 'off') : 'on'
  return { mode, disableModelInvocation, userInvocable, name, description }
}

/**
 * Rewrite one header block for a mode, keeping every unrelated line untouched.
 * @param {string[]} header - frontmatter lines between the delimiters.
 * @param {'on' | 'user' | 'off'} mode - target mode.
 * @returns {{ header: string[], changed: boolean }} the rewritten header and whether it differs.
 */
export function setModeOnHeader(header, mode) {
  const kept = header.filter((line) => {
    const match = /^([A-Za-z0-9_-]+)[ \t]*:/.exec(line)
    return match === null || (match[1] !== DISABLE_MODEL && match[1] !== USER_INVOCABLE)
  })
  const injected = []
  if (mode === 'user' || mode === 'off') injected.push(`${DISABLE_MODEL}: true`)
  if (mode === 'off') injected.push(`${USER_INVOCABLE}: false`)
  const next = [...kept, ...injected]
  const changed = next.length !== header.length || next.some((line, index) => line !== header[index])
  return { header: next, changed }
}

/**
 * Apply a mode to a whole skill document.
 * @param {string} text - current file text.
 * @param {'on' | 'user' | 'off'} mode - target mode.
 * @returns {{ text: string, mode: 'on' | 'user' | 'off', changed: boolean }}
 * @throws {Error} when the file has no frontmatter block or the mode is unknown.
 */
export function applyMode(text, mode) {
  if (!MODES.includes(mode)) throw new Error(`unknown skill mode "${String(mode)}"`)
  const document = splitDocument(text)
  if (document === undefined) throw new Error('skill file has no YAML frontmatter block')
  const { header, changed } = setModeOnHeader(document.header, mode)
  if (!changed) return { text, mode, changed: false }
  const lines = ['---', ...header, '---', ...document.body]
  return { text: lines.join(document.newline), mode, changed: true }
}

/**
 * Read the mode and identity of a skill document without rewriting it.
 * @param {string} text - file text.
 * @returns {{ mode: 'on' | 'user' | 'off', name?: string, description?: string } | undefined}
 *   undefined when the file carries no frontmatter.
 */
export function inspectDocument(text) {
  const document = splitDocument(text)
  if (document === undefined) return undefined
  return readFlags(document.header)
}

/**
 * Whether a path sits under a skill root the manager may rewrite. Only the
 * provider's default roots count: project and user `.dsh/skills` and
 * `.agents/skills` directories. Bundled or custom roots stay read-only.
 * @param {string} path - candidate absolute path.
 * @returns {boolean} whether the manager owns this file.
 */
export function isWritableSkillPath(path) {
  if (typeof path !== 'string' || !path.toLowerCase().endsWith('.md')) return false
  const normalized = path.replace(/\\/g, '/')
  return /(^|\/)\.dsh\/skills\/[^/]+(\/[^/]+)*\.md$/.test(normalized)
    || /(^|\/)\.agents\/skills\/[^/]+(\/[^/]+)*\.md$/.test(normalized)
}

/**
 * Derive the default skill roots for one workspace directory.
 * @param {string} directory - workspace or project directory.
 * @returns {string[]} candidate skill roots, project roots first.
 */
export function projectSkillRoots(directory) {
  if (typeof directory !== 'string' || directory.length === 0) return []
  const base = directory.replace(/[\\/]+$/, '')
  return [`${base}/.dsh/skills`, `${base}/.agents/skills`]
}

/**
 * Derive the default user-level skill roots.
 * @param {string} home - user home directory.
 * @returns {string[]} candidate skill roots.
 */
export function userSkillRoots(home) {
  if (typeof home !== 'string' || home.length === 0) return []
  const base = home.replace(/[\\/]+$/, '')
  return [`${base}/.dsh/skills`, `${base}/.agents/skills`]
}
