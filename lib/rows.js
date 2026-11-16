/**
 * Pure helpers shared by the host half, the browser half and the tests:
 * override merging/pruning, inventory enrichment and view filtering.
 *
 * Nothing here touches the filesystem or React, so it runs under plain
 * `node --test` and inside the browser bundle unchanged.
 */

/** Every mode the manager accepts, in display order. */
export const MODES = ['on', 'user', 'off']

/** Source buckets the host can label; the browser adds `project`/`catalog` itself. */
export const SOURCES = ['project', 'user', 'bundled', 'catalog', 'unknown']

/**
 * Merge one requested mode into the override list.
 * @param {Array<{path?: string, name?: string, mode?: string}>} overrides - current list.
 * @param {{path: string, name?: string, mode: string}} entry - the row to record.
 * @returns {Array<{path: string, name: string, mode: string}>} a new list; the entry replaces any earlier one, others keep order.
 */
export function mergeOverride(overrides, entry) {
  const list = Array.isArray(overrides) ? overrides : []
  const kept = list.filter((item) => item !== null && typeof item === 'object' && item.path !== entry.path)
  return [...kept, { path: entry.path, name: entry.name ?? '', mode: entry.mode }]
}

/**
 * Drop override rows whose file no longer exists.
 * @param {Array<{path?: string}>} overrides - current list.
 * @param {(path: string) => boolean} exists - predicate the caller backs with the filesystem.
 * @returns {{ overrides: Array, removed: number }} the surviving list and how many rows were dropped.
 */
export function pruneOverrides(overrides, exists) {
  const list = Array.isArray(overrides) ? overrides : []
  const kept = []
  let removed = 0
  for (const item of list) {
    if (item === null || typeof item !== 'object' || typeof item.path !== 'string') {
      removed += 1
      continue
    }
    if (exists(item.path)) kept.push(item)
    else removed += 1
  }
  return { overrides: kept, removed }
}

/**
 * Count the modes of a row list.
 * @param {Array<{mode?: string}>} rows - rows to count.
 * @returns {{ total: number, on: number, limited: number, off: number }} counts by mode.
 */
export function summarize(rows) {
  const list = Array.isArray(rows) ? rows : []
  let on = 0
  let limited = 0
  let off = 0
  for (const row of list) {
    if (row?.mode === 'on') on += 1
    else if (row?.mode === 'user') limited += 1
    else off += 1
  }
  return { total: list.length, on, limited, off }
}

/**
 * Filter rows by a free-text query over name and description.
 * @param {Array<{name?: string, description?: string, path?: string}>} rows - rows to filter.
 * @param {string} query - case-insensitive substring; blank returns the list unchanged.
 * @returns {Array} the matching rows.
 */
export function filterRows(rows, query) {
  const list = Array.isArray(rows) ? rows : []
  const needle = String(query ?? '').trim().toLowerCase()
  if (needle === '') return list
  return list.filter((row) => {
    const haystack = `${row?.name ?? ''} ${row?.description ?? ''} ${row?.path ?? ''}`.toLowerCase()
    return haystack.includes(needle)
  })
}

/**
 * Derive a display name from a skill file path: the directory name for a
 * `<skill>/SKILL.md` bundle, the file stem for a flat `<skill>.md`.
 * @param {string} path - absolute skill file path.
 * @returns {string} the derived name.
 */
export function nameFromPath(path) {
  const parts = String(path ?? '').split(/[\\/]/).filter(Boolean)
  const file = parts.pop() ?? ''
  const stem = file.replace(/\.md$/i, '')
  if (/^skill$/i.test(stem) && parts.length > 0) return parts[parts.length - 1]
  return stem
}

/**
 * Join the host inventory with the live catalog into one display list.
 * The catalog wins for mode/description (it is what the model actually sees),
 * the inventory fills in skills the catalog cannot show (hidden ones) and
 * supplies `source`/`writable` metadata.
 * @param {Array<{name?: string, path?: string, source?: string, mode?: string, writable?: boolean, description?: string, size?: number, mtimeMs?: number}>} inventory - host scan result.
 * @param {Array<{name?: string, path?: string, description?: string, modelInvocable?: boolean}>} catalog - session catalog.
 * @param {Array<{path: string, name?: string, mode?: string}>} overrides - recorded requests.
 * @returns {Array} sorted display rows; each row carries name/path/mode/description/source/writable/restored.
 */
export function buildRows(inventory, catalog, overrides) {
  const byPath = new Map()
  const put = (row) => {
    if (typeof row?.path !== 'string' || row.path === '') return
    byPath.set(row.path, { ...byPath.get(row.path), ...row })
  }
  for (const row of Array.isArray(inventory) ? inventory : []) {
    put({
      path: row.path,
      name: row.name ?? '',
      mode: MODES.includes(row.mode) ? row.mode : 'on',
      description: row.description ?? '',
      source: row.source ?? 'unknown',
      writable: row.writable === true,
      size: Number(row.size ?? 0),
      mtimeMs: Number(row.mtimeMs ?? 0),
    })
  }
  for (const row of Array.isArray(catalog) ? catalog : []) {
    if (typeof row?.path !== 'string') continue
    put({
      path: row.path,
      name: row.name ?? '',
      mode: row.modelInvocable ? 'on' : 'user',
      description: row.description ?? '',
      source: byPath.get(row.path)?.source ?? 'catalog',
      writable: byPath.get(row.path)?.writable ?? false,
    })
  }
  for (const row of Array.isArray(overrides) ? overrides : []) {
    if (typeof row?.path !== 'string' || !MODES.includes(row.mode)) continue
    const existing = byPath.get(row.path)
    if (existing !== undefined) {
      existing.mode = row.mode
      if (!existing.name && row.name) existing.name = row.name
      continue
    }
    byPath.set(row.path, {
      path: row.path,
      name: row.name || nameFromPath(row.path),
      mode: row.mode,
      description: '',
      source: 'unknown',
      writable: false,
      restored: true,
    })
  }
  return [...byPath.values()]
    .filter((row) => row.name !== '')
    .sort((left, right) => String(left.name).localeCompare(String(right.name)))
}

/**
 * Group rows by source bucket for display.
 * @param {Array<{source?: string}>} rows - display rows.
 * @param {string[]} order - preferred bucket order; unknown buckets follow.
 * @returns {Array<{source: string, rows: Array}>} groups, empty buckets omitted.
 */
export function groupRows(rows, order = SOURCES) {
  const buckets = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    const source = typeof row?.source === 'string' && row.source !== '' ? row.source : 'unknown'
    if (!buckets.has(source)) buckets.set(source, [])
    buckets.get(source).push(row)
  }
  const known = order.filter((source) => buckets.has(source))
  const extra = [...buckets.keys()].filter((source) => !order.includes(source)).sort()
  return [...known, ...extra].map((source) => ({ source, rows: buckets.get(source) }))
}


