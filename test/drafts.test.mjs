import test from 'node:test'
import assert from 'node:assert/strict'
import { draftArchive, draftCreate, draftEdit } from '../lib/drafts.js'

const ROW = { name: 'windows-ops', path: 'F:\\work\\.dsh\\skills\\windows-ops\\SKILL.md', mode: 'on' }

test('draftEdit names the skill and its absolute path', () => {
  const text = draftEdit(ROW)
  assert.match(text, /windows-ops/)
  assert.ok(text.includes(ROW.path), 'path must be verbatim so the agent edits the right file')
  assert.match(text, /disable-model-invocation/)
  assert.match(text, /500/)
})

test('draftArchive asks for an archive move, never a hard delete', () => {
  const text = draftArchive(ROW)
  assert.match(text, /归档/)
  assert.match(text, /\.archive\//)
  assert.ok(text.includes('windows-ops'))
  assert.doesNotMatch(text, /删除文件|rm -rf|del /i)
})

test('draftCreate carries the target root and the description budget', () => {
  const text = draftCreate({ rootLabel: '~/.dsh/skills/<name>/SKILL.md' })
  assert.match(text, /kebab-case/)
  assert.match(text, /500/)
  assert.ok(text.includes('~/.dsh/skills/<name>/SKILL.md'))
})

test('drafts tolerate a row without a name', () => {
  assert.match(draftEdit({ path: 'C:\\x\\SKILL.md' }), /skill/)
  assert.match(draftArchive({}), /skill/)
})
