import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { applyMode, inspectDocument, isWritableSkillPath, projectSkillRoots, userSkillRoots } from '../lib/skills.js'

const DOCUMENT = [
  '---',
  'name: demo-skill',
  'description: Demo skill for tests',
  '---',
  '',
  '# Demo',
  '',
  'Body stays untouched.',
].join('\n')

test('adds both restriction keys for off', () => {
  const result = applyMode(DOCUMENT, 'off')
  assert.equal(result.mode, 'off')
  assert.ok(result.changed)
  assert.match(result.text, /^disable-model-invocation: true$/m)
  assert.match(result.text, /^user-invocable: false$/m)
  assert.equal(inspectDocument(result.text).mode, 'off')
})

test('hides only from the model for user', () => {
  const once = applyMode(DOCUMENT, 'user')
  assert.ok(once.changed)
  assert.match(once.text, /^disable-model-invocation: true$/m)
  assert.doesNotMatch(once.text, /user-invocable/)
  assert.equal(inspectDocument(once.text).mode, 'user')
})

test('removes both restriction keys for on', () => {
  const off = applyMode(DOCUMENT, 'off')
  const back = applyMode(off.text, 'on')
  assert.ok(back.changed)
  assert.equal(back.text, DOCUMENT)
  assert.equal(inspectDocument(back.text).mode, 'on')
})

test('is idempotent', () => {
  const off = applyMode(DOCUMENT, 'off')
  const again = applyMode(off.text, 'off')
  assert.equal(again.changed, false)
  assert.equal(again.text, off.text)
})

test('keeps CRLF line endings', () => {
  const crlf = DOCUMENT.split('\n').join('\r\n')
  const result = applyMode(crlf, 'off')
  assert.ok(result.text.includes('\r\n'))
  assert.equal(result.text.includes('\n\n'), false)
  assert.equal(result.text.split('\r\n').length, crlf.split('\r\n').length + 2)
})

test('keeps unrelated frontmatter keys and the body', () => {
  const source = [
    '---',
    'name: demo-skill',
    'description: Demo skill for tests',
    'allowed-tools: read',
    '---',
    '',
    'Body stays untouched.',
  ].join('\n')
  const result = applyMode(source, 'off')
  assert.match(result.text, /^allowed-tools: read$/m)
  assert.ok(result.text.endsWith('\n\nBody stays untouched.'))
})

test('overwrites a hand-written conflicting key instead of duplicating it', () => {
  const source = DOCUMENT.replace('description: Demo skill for tests', 'description: Demo skill for tests\ndisable-model-invocation: false')
  const result = applyMode(source, 'user')
  const occurrences = result.text.match(/disable-model-invocation/g) ?? []
  assert.equal(occurrences.length, 1)
  assert.match(result.text, /^disable-model-invocation: true$/m)
})

test('rejects documents without frontmatter', () => {
  assert.throws(() => applyMode('# no frontmatter\n', 'off'), /frontmatter/)
})

test('rejects unknown modes', () => {
  assert.throws(() => applyMode(DOCUMENT, 'maybe'), /unknown skill mode/)
})

test('classifies writable skill paths', () => {
  assert.equal(isWritableSkillPath('C:\\Users\\me\\.dsh\\skills\\demo\\SKILL.md'), true)
  assert.equal(isWritableSkillPath('/home/me/.agents/skills/demo.md'), true)
  assert.equal(isWritableSkillPath('F:\\dsh\\.dsh\\skills\\gameprice-dev\\SKILL.md'), true)
  assert.equal(isWritableSkillPath('C:\\Program Files\\dsh\\skills\\bundled\\SKILL.md'), false)
  assert.equal(isWritableSkillPath('C:\\Users\\me\\.dsh\\skills\\demo\\notes.txt'), false)
})

test('derives default roots', () => {
  assert.deepEqual(projectSkillRoots('F:\\dsh'), ['F:\\dsh/.dsh/skills', 'F:\\dsh/.agents/skills'])
  assert.deepEqual(userSkillRoots('C:\\Users\\me'), ['C:\\Users\\me/.dsh/skills', 'C:\\Users\\me/.agents/skills'])
  assert.deepEqual(projectSkillRoots(''), [])
})

test('round-trips a fixture skill file without touching unrelated lines', async () => {
  const source = await readFile(new URL('./fixtures/demo-SKILL.md', import.meta.url), 'utf8')
  const off = applyMode(source, 'off')
  const after = off.text.split(/\r?\n/)
  assert.equal(after.length, source.split(/\r?\n/).length + 2)
  assert.match(off.text, /^allowed-tools: read$/m)
  assert.equal(inspectDocument(off.text).mode, 'off')
  const restored = applyMode(off.text, 'on')
  assert.equal(restored.text, source)
})

test('round-trips a CRLF fixture preserving the line endings', async () => {
  const source = await readFile(new URL('./fixtures/demo-crlf-SKILL.md', import.meta.url), 'utf8')
  const off = applyMode(source, 'off')
  assert.ok(off.text.includes('\r\n'))
  assert.ok(!off.text.includes('\n\n'))
  assert.equal(inspectDocument(off.text).mode, 'off')
  const restored = applyMode(off.text, 'on')
  assert.equal(restored.text, source)
})
