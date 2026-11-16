/**
 * Filesystem discovery for the manager's inventory: walk the skill roots the
 * provider scans, resolve symlinked entries, and project each instruction file
 * into one inventory row.
 *
 * Rows carry the mode read from the file itself (the same frontmatter the
 * harvester honours), so the browser can show skills the session catalog
 * cannot — for example skills hidden with `user-invocable: false`.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { inspectDocument, isWritableSkillPath, projectSkillRoots, userSkillRoots } from './skills.js'

/**
 * Build the ordered root list.
 * @param {{ home?: string, dir?: string, bundled?: string, custom?: string[] }} options - scan inputs.
 * @returns {Array<{path: string, source: string}>} roots in precedence order, duplicates removed.
 */
export function rootsFor(options = {}) {
  const roots = []
  const seen = new Set()
  const push = (path, source) => {
    if (typeof path !== 'string' || path === '' || seen.has(path)) return
    seen.add(path)
    roots.push({ path, source })
  }
  for (const path of projectSkillRoots(options.dir)) push(path, 'project')
  for (const path of Array.isArray(options.custom) ? options.custom : []) push(path, 'custom')
  for (const path of userSkillRoots(options.home)) push(path, 'user')
  push(options.bundled, 'bundled')
  return roots
}

/**
 * Resolve one root entry to its instruction file, following symlinks.
 * @param {string} path - absolute entry path.
 * @param {import('node:fs').Dirent} entry - directory entry from the root listing.
 * @returns {Promise<string | undefined>} the instruction file, or undefined when the entry is not a skill.
 */
async function skillFileOf(path, entry) {
  if (entry.isDirectory()) return join(path, 'SKILL.md')
  if (entry.isFile()) return path.toLowerCase().endsWith('.md') ? path : undefined
  if (!entry.isSymbolicLink()) return undefined
  try {
    const target = await stat(path)
    if (target.isDirectory()) return join(path, 'SKILL.md')
    return target.isFile() && path.toLowerCase().endsWith('.md') ? path : undefined
  } catch {
    return undefined
  }
}

/**
 * Scan every root and return one row per distinct skill name.
 * @param {Array<{path: string, source: string}>} roots - roots in precedence order.
 * @returns {Promise<Array<{name: string, path: string, mode: string, description: string, source: string, writable: boolean}>>}
 *   sorted rows; the first root providing a name wins.
 */
export async function scanRoots(roots) {
  const seen = new Set()
  const rows = []
  for (const root of Array.isArray(roots) ? roots : []) {
    let entries
    try {
      entries = await readdir(root.path, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const path = await skillFileOf(join(root.path, entry.name), entry)
      if (path === undefined) continue
      let text
      try {
        text = await readFile(path, 'utf8')
      } catch {
        continue
      }
      const inspected = inspectDocument(text)
      if (inspected === undefined) continue
      const name = inspected.name ?? basename(entry.name, '.md')
      if (seen.has(name)) continue
      seen.add(name)
      const info = await stat(path).catch(() => undefined)
      rows.push({
        name,
        path,
        mode: inspected.mode,
        description: inspected.description ?? '',
        source: root.source,
        writable: isWritableSkillPath(path),
        size: info?.size ?? Buffer.byteLength(text, 'utf8'),
        mtimeMs: info?.mtimeMs ?? 0,
      })
    }
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name))
}

