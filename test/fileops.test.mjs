import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_DOCUMENT_BYTES, archiveDestination, checkWritePreconditions, inspectDraft, templateSkill, validateSkillName,
} from '../lib/fileops.js'

test('validateSkillName accepts kebab-case and rejects everything else', () => {
  assert.deepEqual(validateSkillName('windows-ops'), { ok: true, name: 'windows-ops' })
  assert.deepEqual(validateSkillName('  my-skill  '), { ok: true, name: 'my-skill' })
  assert.equal(validateSkillName('Bad Name').ok, false)
  assert.equal(validateSkillName('-leading').ok, false)
  assert.equal(validateSkillName('a').ok, false)
  assert.equal(validateSkillName('').ok, false)
  assert.equal(validateSkillName('x'.repeat(70)).ok, false)
})

test('templateSkill produces a document the inspector accepts', () => {
  const text = templateSkill('my-skill', 'Use when building something small.')
  assert.match(text, /^---\nname: my-skill\ndescription: Use when building something small\.\n---\n/)
  const checked = inspectDraft(text)
  assert.deepEqual(checked.problems, [])
  assert.equal(checked.ok, true)
})

test('templateSkill falls back to a generic description', () => {
  assert.match(templateSkill('my-skill', '   '), /description: Use when a task matches my-skill\./)
})

test('inspectDraft reports each missing piece', () => {
  assert.equal(inspectDraft('no frontmatter').ok, false)
  assert.ok(inspectDraft('---\nname: x\n---\n').problems.some((problem) => problem.includes('description')))
  assert.ok(inspectDraft('---\ndescription: y\n---\n').problems.some((problem) => problem.includes('name')))
  assert.ok(inspectDraft('---\nname: x\ndescription: y\n').problems.some((problem) => problem.includes('closed')))
  const long = inspectDraft(`---\nname: x\ndescription: ${'a'.repeat(501)}\n---\n`)
  assert.ok(long.problems.some((problem) => problem.includes('500')))
})

test('inspectDraft flags an oversized document', () => {
  const big = `---\nname: x\ndescription: y\n---\n${'a'.repeat(MAX_DOCUMENT_BYTES)}`
  assert.ok(inspectDraft(big).problems.some((problem) => problem.includes('KB')))
})

test('inspectDraft notices when the invocation switches disappeared', () => {
  const without = inspectDraft('---\nname: x\ndescription: y\n---\n')
  assert.equal(without.modeRemoved, true)
  const withKeys = inspectDraft('---\nname: x\ndescription: y\ndisable-model-invocation: true\n---\n')
  assert.equal(withKeys.modeRemoved, false)
})

test('checkWritePreconditions guards stale writes', () => {
  assert.equal(checkWritePreconditions({ path: 'C:\\a\\SKILL.md', baseMtimeMs: 0 }, 123).ok, true)
  assert.equal(checkWritePreconditions({ path: 'C:\\a\\SKILL.md', baseMtimeMs: 123 }, 123).ok, true)
  const stale = checkWritePreconditions({ path: 'C:\\a\\SKILL.md', baseMtimeMs: 100 }, 200)
  assert.equal(stale.ok, false)
  assert.equal(stale.conflict, true)
  assert.equal(checkWritePreconditions({}, 0).ok, false)
})

test('archiveDestination nests under .archive with a sortable stamp', () => {
  const target = archiveDestination('C:\\Users\\me\\.dsh\\skills', 'windows-ops', new Date('2026-11-16T04:05:06Z'))
  assert.equal(target.stamp, '20261116-040506')
  assert.ok(target.dir.endsWith('.archive\\windows-ops-20261116-040506'))
})
