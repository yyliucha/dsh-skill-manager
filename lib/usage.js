/**
 * Skill-usage bookkeeping shared by the host, the tests and (as small copies)
 * the browser half: which skill a session loaded, in which turn, and when.
 *
 * The host records these from the durable `tool/call` session events, so the
 * composer menu can show what is active now and the turn tail can list the
 * skills a finished turn used.
 */

/** How long a loaded skill still counts as "in use", in milliseconds. */
export const ACTIVE_WINDOW_MS = 45 * 60 * 1000

/** Highest number of usage rows kept in the plugin configuration. */
export const USAGE_LIMIT = 80

/**
 * Read the skill name out of a `skill` tool call's raw arguments.
 * @param {unknown} raw - JSON string (or already-parsed object) of the tool call.
 * @returns {string | undefined} the skill name when the payload carries one.
 */
export function parseSkillArguments(raw) {
  let value = raw
  if (typeof raw === 'string') {
    const text = raw.trim()
    if (text === '') return undefined
    try {
      value = JSON.parse(text)
    } catch {
      return undefined
    }
  }
  if (value === null || typeof value !== 'object') return undefined
  const name = value.name ?? value.skill ?? value.skillName
  return typeof name === 'string' && name.trim() !== '' ? name.trim() : undefined
}

/**
 * Append one usage row, replacing an identical (session, turn, skill) record and
 * keeping the list bounded.
 * @param {Array<{sessionId?: string, turn?: number, name?: string, at?: number}>} list - existing rows.
 * @param {{sessionId: string, turn: number, name: string, at: number}} entry - the new row.
 * @param {number} limit - maximum rows kept.
 * @returns {Array} a new, time-ordered list.
 */
export function recordUsage(list, entry, limit = USAGE_LIMIT) {
  const rows = Array.isArray(list) ? list.filter((row) => row !== null && typeof row === 'object') : []
  const next = rows.filter((row) => !(row.sessionId === entry.sessionId && row.turn === entry.turn && row.name === entry.name))
  next.push({ sessionId: entry.sessionId, turn: entry.turn, name: entry.name, at: entry.at })
  next.sort((left, right) => Number(left.at ?? 0) - Number(right.at ?? 0))
  return next.length > limit ? next.slice(next.length - limit) : next
}

/**
 * List one session's usage rows, newest last.
 * @param {Array<{sessionId?: string}>} list - all rows.
 * @param {string} sessionId - the session to filter.
 * @returns {Array} the session's rows.
 */
export function usageForSession(list, sessionId) {
  return (Array.isArray(list) ? list : []).filter((row) => row?.sessionId === sessionId)
}

/**
 * Resolve the skill that currently counts as in use for a session.
 * @param {Array<{sessionId?: string, name?: string, at?: number}>} list - all rows.
 * @param {string} sessionId - the session to inspect.
 * @param {number} now - clock, injected for tests.
 * @param {number} windowMs - recency window.
 * @returns {string | undefined} the most recently loaded skill inside the window.
 */
export function activeSkill(list, sessionId, now = Date.now(), windowMs = ACTIVE_WINDOW_MS) {
  const rows = usageForSession(list, sessionId)
  let best
  for (const row of rows) {
    if (typeof row.name !== 'string' || row.name === '') continue
    const at = Number(row.at ?? 0)
    if (!Number.isFinite(at) || now - at > windowMs) continue
    if (best === undefined || at > Number(best.at ?? 0)) best = row
  }
  return best?.name
}

/**
 * Unique skill names a specific turn loaded, in load order.
 * @param {Array<{sessionId?: string, turn?: number, name?: string, at?: number}>} list - all rows.
 * @param {string} sessionId - the session to inspect.
 * @param {number} turn - the turn number.
 * @returns {string[]} distinct names.
 */
export function usageForTurn(list, sessionId, turn) {
  const names = []
  for (const row of usageForSession(list, sessionId)) {
    if (row.turn !== turn) continue
    if (typeof row.name !== 'string' || row.name === '') continue
    if (!names.includes(row.name)) names.push(row.name)
  }
  return names
}

/**
 * Distinct skills a session used, newest first.
 * @param {Array<{sessionId?: string, name?: string, at?: number}>} list - all rows.
 * @param {string} sessionId - the session to inspect.
 * @returns {string[]} distinct names, most recent first.
 */
export function sessionSkillNames(list, sessionId) {
  const rows = usageForSession(list, sessionId).slice().sort((left, right) => Number(right.at ?? 0) - Number(left.at ?? 0))
  const names = []
  for (const row of rows) {
    if (typeof row.name !== 'string' || row.name === '') continue
    if (!names.includes(row.name)) names.push(row.name)
  }
  return names
}
