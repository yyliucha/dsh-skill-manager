import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRows, filterRows, groupRows, mergeOverride, pruneOverrides, summarize } from '../lib/rows.js'

const A = 'C:\\Users\\me\\.dsh\\skills\\alpha\\SKILL.md'
const B = 'F:\\work\\.dsh\\skills\\beta\\SKILL.md'

test('mergeOverride replaces an existing path and appends new ones', () => {
  const first = mergeOverride([], { path: A, name: 'alpha', mode: 'off' })
  assert.deepEqual(first, [{ path: A, name: 'alpha', mode: 'off' }])
  const second = mergeOverride(first, { path: A, name: 'alpha', mode: 'on' })
  assert.deepEqual(second, [{ path: A, name: 'alpha', mode: 'on' }])
  const third = mergeOverride(second, { path: B, name: 'beta', mode: 'user' })
  assert.deepEqual(third.map((row) => row.mode), ['on', 'user'])
})

test('pruneOverrides drops rows whose file disappeared', () => {
  const overrides = [{ path: A, name: 'alpha', mode: 'off' }, { path: B, name: 'beta', mode: 'on' }]
  const kept = pruneOverrides(overrides, (path) => path === B)
  assert.equal(kept.removed, 1)
  assert.deepEqual(kept.overrides.map((row) => row.path), [B])
})

test('summarize counts each mode', () => {
  assert.deepEqual(
    summarize([{ mode: 'on' }, { mode: 'on' }, { mode: 'user' }, { mode: 'off' }]),
    { total: 4, on: 2, limited: 1, off: 1 },
  )
})

test('filterRows matches name, description and path, ignoring case', () => {
  const rows = [
    { name: 'alpha', description: 'Alphabet helper', path: A },
    { name: 'beta', description: 'second', path: B },
  ]
  assert.equal(filterRows(rows, '').length, 2)
  assert.deepEqual(filterRows(rows, 'ALPHA').map((row) => row.name), ['alpha'])
  assert.deepEqual(filterRows(rows, 'second').map((row) => row.name), ['beta'])
  assert.deepEqual(filterRows(rows, 'nothing').length, 0)
})

test('buildRows lets the catalog win for mode and keeps hidden inventory rows', () => {
  const inventory = [
    { name: 'alpha', path: A, mode: 'off', source: 'user', writable: true },
    { name: 'beta', path: B, mode: 'on', source: 'project', writable: true },
  ]
  const catalog = [{ name: 'beta', path: B, description: 'from catalog', modelInvocable: true }]
  const overrides = [{ path: A, name: 'alpha', mode: 'off' }]
  const rows = buildRows(inventory, catalog, overrides)
  assert.deepEqual(rows.map((row) => row.name), ['alpha', 'beta'])
  const alpha = rows[0]
  assert.equal(alpha.mode, 'off', 'hidden skill stays visible via inventory')
  assert.equal(alpha.source, 'user')
  assert.equal(alpha.writable, true)
  const beta = rows[1]
  assert.equal(beta.description, 'from catalog')
  assert.equal(beta.source, 'project', 'inventory supplies the source label')
})

test('buildRows falls back to an override-only row with a derived name', () => {
  const rows = buildRows([], [], [{ path: 'C:\\skills\\gamma\\SKILL.md', name: '', mode: 'user' }])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'gamma')
  assert.equal(rows[0].mode, 'user')
})

test('groupRows groups by source in the preferred order', () => {
  const groups = groupRows([
    { name: 'a', source: 'bundled' },
    { name: 'b', source: 'project' },
    { name: 'c', source: 'project' },
  ], ['project', 'user', 'bundled'])
  assert.deepEqual(groups.map((group) => group.source), ['project', 'bundled'])
  assert.equal(groups[0].rows.length, 2)
})
