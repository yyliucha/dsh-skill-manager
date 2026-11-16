/**
 * Host half of the skill manager.
 *
 * Truth lives in each skill's `SKILL.md` frontmatter (the two invocation keys
 * the harvester already honours). This plugin keeps two derived records in its
 * volatile Configuration so the browser can show and edit everything without a
 * custom Host↔Client channel:
 *
 * - `overrides`  … the last requested mode per skill file; a write request from
 *                  the UI (or the tool) lands here and the volatile-update
 *                  listener rewrites the matching files.
 * - `inventory`  … the host-side scan (user roots, bundled root, optional custom
 *                  roots). It lets the UI list skills the session catalog cannot
 *                  show — hidden ones included — with a source label.
 * - `lastWrite`  … the receipt of the most recent apply, so the UI can report
 *                  “wrote N files / M failed”.
 *
 * @module @local/dsh-skill-manager
 */
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, extname, join, resolve } from 'node:path'
import z from '@deepseek-ai/schemastery'
import { applyMode, inspectDocument, isWritableSkillPath, MODES } from './lib/skills.js'
import { rootsFor, scanRoots } from './lib/scan.js'
import { mergeOverride, pruneOverrides } from './lib/rows.js'
import { archiveDestination, checkWritePreconditions, inspectDraft, templateSkill, validateSkillName } from './lib/fileops.js'
import { parseSkillArguments, recordUsage } from './lib/usage.js'

/** Loader-facing plugin name. */
export const name = 'skill-manager'

/** Empty request; the client fills it, the host answers through `result`. */
const EMPTY_REQUEST = Object.freeze({ id: '', op: '', path: '', content: '', baseMtimeMs: 0, name: '', description: '', root: '' })

/** Empty result. */
const EMPTY_RESULT = Object.freeze({
  id: '', ok: false, op: '', path: '', message: '', conflict: false,
  content: '', size: 0, mtimeMs: 0, archivedTo: '', at: '',
})

/** Configuration: requests, host inventory and the last write receipt. */
export const Config = z.object({
  overrides: z.array(z.object({
    path: z.string().required(),
    name: z.string().default(''),
    mode: z.string().default('on'),
  })).default([]).volatile(),
  inventory: z.array(z.object({
    path: z.string().required(),
    mode: z.string().default('on'),
    source: z.string().default('unknown'),
    writable: z.boolean().default(false),
    size: z.number().default(0),
    mtimeMs: z.number().default(0),
  })).default([]).volatile(),
  lastWrite: z.object({
    at: z.string().default(''),
    ok: z.number().default(0),
    failed: z.number().default(0),
    error: z.string().default(''),
  }).default({ at: '', ok: 0, failed: 0, error: '' }).volatile(),
  request: z.object({
    id: z.string().default(''),
    op: z.string().default(''),
    path: z.string().default(''),
    content: z.string().default(''),
    baseMtimeMs: z.number().default(0),
    name: z.string().default(''),
    description: z.string().default(''),
    root: z.string().default(''),
  }).default({ ...EMPTY_REQUEST }).volatile(),
  result: z.object({
    id: z.string().default(''),
    ok: z.boolean().default(false),
    op: z.string().default(''),
    path: z.string().default(''),
    message: z.string().default(''),
    conflict: z.boolean().default(false),
    content: z.string().default(''),
    size: z.number().default(0),
    mtimeMs: z.number().default(0),
    archivedTo: z.string().default(''),
    at: z.string().default(''),
  }).default({ ...EMPTY_RESULT }).volatile(),
  diagnostic: z.string().default('').volatile(),
  usage: z.array(z.object({
    sessionId: z.string().required(),
    turn: z.number().default(0),
    name: z.string().required(),
    at: z.number().default(0),
  })).default([]).volatile(),
  customSkillDirs: z.array(z.string()).default([]),
})

/** Tool parameter schema. */
const TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['list', 'set'], description: 'list the discovered skills, or set one skill\'s mode' },
    path: { type: 'string', description: 'Absolute SKILL.md path; required for set' },
    mode: { type: 'string', enum: MODES, description: 'on: model and user; user: user only; off: neither' },
    dir: { type: 'string', description: 'Optional project directory whose .dsh/skills roots should be included' },
  },
  required: ['action'],
  additionalProperties: false,
}

/** Tool output schema. */
const TOOL_OUTPUT = {
  type: 'object',
  properties: { text: { type: 'string' } },
  required: ['text'],
  additionalProperties: false,
}

/**
 * Read a volatile array field defensively.
 * @param {{ get?: () => unknown }} field - volatile configuration field.
 * @returns {Array} the array value, or an empty list.
 */
function readArray(field) {
  try {
    const value = field?.get?.()
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

/**
 * Persist a patch into this plugin's own Configuration from Host code.
 * Runs outside the HMR transaction that owns `apply`, because the config editor
 * refuses nested transactions; a volatile-only change commits in place.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} patch - fields to merge into the entry config.
 * @returns {Promise<boolean>} whether the write was accepted.
 */
async function writeConfig(ctx, patch) {
  const entry = ctx.fiber?.entry
  const editor = ctx.get?.('configEditor')
  if (entry === undefined || editor === undefined) return false
  const run = () => editor.edit(entry, (current) => ({ ...current, ...patch }))
  const hmr = ctx.get?.('hmr')
  try {
    if (hmr?.executing?.exit) {
      let result
      hmr.executing.exit(() => { result = run() })
      await result
      return true
    }
    await run()
    return true
  } catch (error) {
    ctx.logger?.warn?.(`skill-manager: saving configuration failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Roots this profile can be scanned from without a project directory.
 * @param {object} config - parsed plugin config.
 * @returns {Array<{path: string, source: string}>} user/custom/bundled roots.
 */
function hostRoots(config) {
  let custom = []
  try {
    const value = config.customSkillDirs
    custom = Array.isArray(value) ? value : []
  } catch {
    custom = []
  }
  return rootsFor({
    home: homedir(),
    bundled: process.env.DSH_BUNDLED_SKILL_DIR,
    custom,
  })
}

/**
 * Scan the host roots and publish a changed inventory back into the Configuration.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} config - parsed plugin config.
 * @returns {Promise<void>} resolves after the write attempt settled.
 */
async function publishInventory(ctx, config) {
  const scanned = await scanRoots(hostRoots(config))
  // Publish only what the UI cannot derive: the path, mode, source and write
  // permission. Names come from the path, descriptions from the session catalog.
  const rows = scanned.map((row) => ({
    path: row.path,
    mode: row.mode,
    source: row.source,
    writable: row.writable,
    size: row.size,
    mtimeMs: row.mtimeMs,
  }))
  const current = JSON.stringify(readArray(config.inventory))
  const next = JSON.stringify(rows)
  if (current === next) return
  const saved = await writeConfig(ctx, { inventory: rows })
  if (!saved) ctx.logger?.warn?.('skill-manager: inventory could not be published (configuration is read-only in this profile)')
}

/**
 * Read a volatile object field defensively.
 * @param {{ get?: () => unknown }} field - volatile configuration field.
 * @returns {object | undefined} the value when it is a plain object.
 */
function readObject(field) {
  try {
    const value = field?.get?.()
    return value !== null && typeof value === 'object' ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * Find the managed skill root that contains a path (`…/.dsh/skills` or `…/.agents/skills`).
 * @param {string} path - absolute file path.
 * @returns {string | undefined} the root prefix.
 */
function skillRootOf(path) {
  const normalized = String(path).replace(/\\/g, '/')
  const match = /^(.*?\/\.(?:dsh|agents)\/skills)\//.exec(normalized)
  return match === null ? undefined : match[1].replace(/\//g, '\\')
}

/** One failed file operation. */
function failure(message, conflict = false) {
  return { ok: false, message, conflict }
}

/**
 * Execute one file operation requested by the UI.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} config - parsed plugin config.
 * @param {{op: string, path: string, content: string, baseMtimeMs: number, name: string, description: string, root: string}} request - the request.
 * @returns {Promise<object>} the result payload.
 */
async function performFileOp(ctx, config, request) {
  const op = String(request.op ?? '')

  if (op === 'read') {
    const target = resolve(request.path)
    if (!isWritableSkillPath(target)) return failure('this file is outside the managed skill roots')
    const info = await stat(target).catch(() => undefined)
    if (info === undefined) return failure('the file no longer exists')
    if (info.size > 256 * 1024) return failure('the file is larger than 256 KB; edit it in an external editor')
    const content = await readFile(target, 'utf8')
    return { ok: true, path: target, content, size: info.size, mtimeMs: info.mtimeMs }
  }

  if (op === 'write') {
    const target = resolve(request.path)
    if (!isWritableSkillPath(target)) return failure(`refusing to write "${target}": not under a managed skill root`)
    const info = await stat(target).catch(() => undefined)
    if (info === undefined) return failure('the file no longer exists')
    const precondition = checkWritePreconditions(request, info.mtimeMs)
    if (!precondition.ok) return failure(precondition.error, precondition.conflict)
    const draft = inspectDraft(request.content)
    if (!draft.ok) return failure(`cannot save: ${draft.problems.join('; ')}`)
    const previous = await readFile(target, 'utf8')
    if (previous !== request.content) {
      await writeFile(`${target}.bak`, previous, 'utf8')
      await writeFile(target, request.content, 'utf8')
    }
    const after = await stat(target).catch(() => undefined)
    return { ok: true, path: target, size: after?.size ?? draft.size, mtimeMs: after?.mtimeMs ?? Date.now() }
  }

  if (op === 'create') {
    const checked = validateSkillName(request.name)
    if (!checked.ok) return failure(checked.error)
    const root = typeof request.root === 'string' && request.root !== '' ? resolve(request.root) : join(homedir(), '.dsh', 'skills')
    const target = join(root, checked.name, 'SKILL.md')
    if (!isWritableSkillPath(target)) return failure(`refusing to create under "${root}": not a managed skill root`)
    if (await stat(target).then(() => true).catch(() => false)) {
      return failure(`a skill named "${checked.name}" already exists in ${root}`, true)
    }
    await mkdir(join(root, checked.name), { recursive: true })
    await writeFile(target, templateSkill(checked.name, request.description), 'utf8')
    const after = await stat(target).catch(() => undefined)
    return { ok: true, path: target, size: after?.size ?? 0, mtimeMs: after?.mtimeMs ?? Date.now() }
  }

  if (op === 'archive') {
    const target = resolve(request.path)
    if (!isWritableSkillPath(target)) return failure(`refusing to archive "${target}": not under a managed skill root`)
    const root = skillRootOf(target)
    if (root === undefined) return failure('could not resolve the skill root for this file')
    const info = await stat(target).catch(() => undefined)
    if (info === undefined) return failure('the file no longer exists')
    const isBundle = basename(target).toLowerCase() === 'skill.md'
    const base = isBundle ? basename(dirname(target)) : basename(target, extname(target))
    const { dir } = archiveDestination(root, base)
    if (await stat(dir).then(() => true).catch(() => false)) return failure('an archive of this skill already exists', true)
    await mkdir(join(root, '.archive'), { recursive: true })
    if (isBundle) {
      await rename(dirname(target), dir)
    } else {
      await mkdir(dir, { recursive: true })
      await rename(target, join(dir, 'SKILL.md'))
    }
    ctx.logger?.info?.(`skill-manager: archived ${target} -> ${dir}`)
    return { ok: true, path: target, archivedTo: dir }
  }

  return failure(`unknown operation "${op}"`)
}

/** One in-flight file operation at a time; results carry the request id back. */
const fileOpState = { busy: false, handledId: '' }

/**
 * Answer one UI file request and clear it so it is never replayed.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} config - parsed plugin config.
 * @returns {Promise<void>} resolves after the result was published.
 */
async function handleRequest(ctx, config) {
  const request = readObject(config.request)
  if (request === undefined) return
  const id = typeof request.id === 'string' ? request.id : ''
  if (id === '' || id === fileOpState.handledId) return
  if (fileOpState.busy) {
    fileOpState.handledId = id
    await writeConfig(ctx, {
      request: { ...EMPTY_REQUEST },
      result: { ...EMPTY_RESULT, id, op: String(request.op ?? ''), message: 'another file operation is still running', at: new Date().toISOString() },
    })
    return
  }
  fileOpState.busy = true
  let result
  try {
    result = await performFileOp(ctx, config, request)
  } catch (error) {
    result = failure(error instanceof Error ? error.message : String(error))
  } finally {
    fileOpState.busy = false
  }
  fileOpState.handledId = id
  await writeConfig(ctx, {
    request: { ...EMPTY_REQUEST },
    result: { ...EMPTY_RESULT, ...result, id, op: String(request.op ?? ''), at: new Date().toISOString() },
  })
  if (result.ok) await publishInventory(ctx, config)
}

/**
 * Rewrite one skill file for a mode.
 * @param {string} path - absolute skill file path.
 * @param {string} mode - one of {@link MODES}.
 * @returns {Promise<{path: string, mode: string, changed: boolean}>} the outcome.
 * @throws {Error} when the path is outside the owned roots, the file is missing,
 *   or it carries no frontmatter.
 */
async function setSkillMode(path, mode) {
  const target = resolve(path)
  if (!isWritableSkillPath(target)) throw new Error(`refusing to rewrite "${target}": not under a managed skill root`)
  const text = await readFile(target, 'utf8')
  const result = applyMode(text, mode)
  if (result.changed) await writeFile(target, result.text, 'utf8')
  return { path: target, mode: result.mode, changed: result.changed }
}

/**
 * Apply every recorded override, prune dead records and publish the receipt.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} config - parsed plugin config.
 * @returns {Promise<void>} resolves after every entry settled.
 */
async function applyOverrides(ctx, config) {
  const recorded = readArray(config.overrides)
  const { existsSync } = await import('node:fs')
  const { overrides, removed } = pruneOverrides(recorded, (path) => existsSync(path))
  let ok = 0
  let failed = 0
  let error = ''
  for (const entry of overrides) {
    if (typeof entry?.path !== 'string' || !MODES.includes(entry.mode)) continue
    try {
      await setSkillMode(entry.path, entry.mode)
      ok += 1
    } catch (failure) {
      failed += 1
      if (error === '') error = failure instanceof Error ? failure.message : String(failure)
      ctx.logger?.warn?.(`skill-manager: ${entry.path}: ${error}`)
    }
  }
  await writeConfig(ctx, {
    ...(removed > 0 ? { overrides } : {}),
    lastWrite: { at: new Date().toISOString(), ok, failed, error },
  })
  await publishInventory(ctx, config)
}

/**
 * Register the volatile-apply listener, the inventory refresher and the tool.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {object} config - parsed Configuration.
 */
export function apply(ctx, config) {
  let publishTimer

  ctx.on('loader/volatile-update', (paths) => {
    const changed = Array.isArray(paths) ? paths : []
    const kinds = changed.map((path) => path?.[0])
    // A request arrives through `overrides` (mode switches) or `request` (file ops);
    // inventory/receipt/result updates are ours.
    if (kinds.includes('overrides')) {
      applyOverrides(ctx, config).catch((error) => {
        ctx.logger?.warn?.(`skill-manager: applying overrides failed: ${error instanceof Error ? error.message : String(error)}`)
      })
    }
    if (kinds.includes('request')) {
      handleRequest(ctx, config).catch((error) => {
        ctx.logger?.warn?.(`skill-manager: file request failed: ${error instanceof Error ? error.message : String(error)}`)
      })
    }
  })

  // The filesystem watcher and the tool both change files; refresh the inventory
  // shortly after, coalescing bursts.
  ctx.on('skills/change', () => {
    if (publishTimer !== undefined) return
    publishTimer = setTimeout(() => {
      publishTimer = undefined
      publishInventory(ctx, config).catch(() => {})
    }, 1500)
    publishTimer?.unref?.()
  })

  // 记录每个会话加载过的技能：对话记录里"本次使用"和菜单里的"使用中"都靠它。
  // 只从持久化的 `tool/call` 事件取，避免客户端自己猜。
  let usageTimer
  let usagePending
  ctx.on('session/event', (session, event) => {
    try {
      if (event?.type !== 'tool/call') return
      const data = event.data
      if (data === null || typeof data !== 'object') return
      if (data.name !== 'skill') return
      const skillName = parseSkillArguments(data.arguments)
      if (skillName === undefined) return
      usagePending = recordUsage(readArray(config.usage), {
        sessionId: String(session.id),
        turn: Number(data.turn ?? 0),
        name: skillName,
        at: Number(event.time ?? Date.now()),
      })
      if (usageTimer !== undefined) return
      usageTimer = setTimeout(() => {
        usageTimer = undefined
        const rows = usagePending
        if (rows === undefined) return
        writeConfig(ctx, { usage: rows }).catch(() => {})
      }, 400)
      usageTimer?.unref?.()
    } catch (error) {
      ctx.logger?.warn?.(`skill-manager: recording skill usage failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  ctx.effect(() => {
    const timer = setTimeout(() => {
      // Drop a request left behind by a crash instead of replaying a write.
      const pending = readObject(config.request)
      if (pending !== undefined && typeof pending.id === 'string' && pending.id !== '') {
        writeConfig(ctx, {
          request: { ...EMPTY_REQUEST },
          result: { ...EMPTY_RESULT, id: pending.id, op: String(pending.op ?? ''), message: 'request dropped: the plugin restarted before finishing it', at: new Date().toISOString() },
        }).catch(() => {})
      }
      publishInventory(ctx, config).catch(() => {})
    }, 2000)
    timer?.unref?.()
    return () => clearTimeout(timer)
  }, 'skill-manager: initial inventory')

  ctx.inject(['tools'], (toolsCtx) => {
    toolsCtx.effect(() => toolsCtx.tools.register({
      name: 'skill_manager',
      description: 'List agent skills and switch one on, to user-only, or off. Modes: on = model and user; '
        + 'user = only the user may invoke it (/name); off = neither surface lists it. Changes are written into the '
        + 'skill\'s SKILL.md frontmatter (disable-model-invocation, user-invocable) and recorded so the Skills panel '
        + 'stays in sync.',
      parameters: TOOL_PARAMETERS,
      output: {
        schema: TOOL_OUTPUT,
        render: (_args, value) => [{ type: 'text', text: value.text }],
      },
      async execute(args) {
        const dir = typeof args.dir === 'string' && args.dir.length > 0 ? args.dir : undefined
        if (args.action === 'list') {
          const rows = await scanRoots(rootsFor({
            home: homedir(),
            dir,
            bundled: process.env.DSH_BUNDLED_SKILL_DIR,
            custom: hostRoots(config).filter((root) => root.source === 'custom').map((root) => root.path),
          }))
          const compact = rows.map((row) => ({
            name: row.name,
            mode: row.mode,
            path: row.path,
            source: row.source,
            writable: row.writable,
            description: row.description.length > 160 ? `${row.description.slice(0, 160)}…` : row.description,
          }))
          return { text: JSON.stringify(compact, null, 2) }
        }
        if (args.action === 'set') {
          if (typeof args.path !== 'string') throw new Error('set requires the absolute `path` of one skill file')
          const result = await setSkillMode(args.path, args.mode ?? 'on')
          // Keep the same record the UI writes, so both surfaces stay consistent.
          const inspected = inspectDocument(await readFile(result.path, 'utf8'))
          const next = mergeOverride(readArray(config.overrides), {
            path: result.path,
            name: inspected?.name ?? '',
            mode: result.mode,
          })
          await writeConfig(ctx, { overrides: next })
          return { text: JSON.stringify(result) }
        }
        throw new Error(`unknown action "${String(args.action)}"`)
      },
    }, { label: 'skill-manager: tool' }))
  }, 'skill-manager: tools')
}






