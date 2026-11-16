import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTIVE_WINDOW_MS, activeSkill, parseSkillArguments, recordUsage, sessionSkillNames, usageForSession, usageForTurn,
} from '../lib/usage.js'

const S1 = 'session-1'
const S2 = 'session-2'

test('parseSkillArguments accepts a JSON string, an object, and alternates', () => {
  assert.equal(parseSkillArguments('{"name":"windows-ops"}'), 'windows-ops')
  assert.equal(parseSkillArguments({ name: 'gameprice-dev' }), 'gameprice-dev')
  assert.equal(parseSkillArguments({ skill: 'verify-before-done' }), 'verify-before-done')
  assert.equal(parseSkillArguments({ skillName: ' sh2-api-log-troubleshoot ' }), 'sh2-api-log-troubleshoot')
  assert.equal(parseSkillArguments('{"name":""}'), undefined)
  assert.equal(parseSkillArguments('not json'), undefined)
  assert.equal(parseSkillArguments(''), undefined)
  assert.equal(parseSkillArguments(null), undefined)
})

test('recordUsage replaces an identical row and keeps the list bounded', () => {
  let list = recordUsage([], { sessionId: S1, turn: 1, name: 'a', at: 10 })
  list = recordUsage(list, { sessionId: S1, turn: 1, name: 'a', at: 20 })
  assert.equal(list.length, 1)
  assert.equal(list[0].at, 20)
  list = recordUsage(list, { sessionId: S1, turn: 2, name: 'b', at: 30 })
  assert.deepEqual(list.map((row) => row.name), ['a', 'b'])
  let many = []
  for (let index = 0; index < 6; index += 1) many = recordUsage(many, { sessionId: S1, turn: index, name: `s${index}`, at: index }, 3)
  assert.deepEqual(many.map((row) => row.name), ['s3', 's4', 's5'])
})

test('usageForSession only returns that session\'s rows', () => {
  const list = [
    { sessionId: S1, turn: 1, name: 'a', at: 1 },
    { sessionId: S2, turn: 1, name: 'b', at: 2 },
  ]
  assert.deepEqual(usageForSession(list, S1).map((row) => row.name), ['a'])
  assert.deepEqual(usageForSession(list, 'missing'), [])
})

test('activeSkill respects the recency window and picks the newest', () => {
  const now = 1_000_000
  const list = [
    { sessionId: S1, turn: 1, name: 'old', at: now - ACTIVE_WINDOW_MS - 1 },
    { sessionId: S1, turn: 2, name: 'newer', at: now - 1000 },
    { sessionId: S1, turn: 3, name: 'newest', at: now - 10 },
    { sessionId: S2, turn: 1, name: 'other-session', at: now - 5 },
  ]
  assert.equal(activeSkill(list, S1, now), 'newest')
  // 超过窗口的整批都过期，且别的会话不算
  assert.equal(activeSkill(list, S1, now + ACTIVE_WINDOW_MS + 1), undefined)
  assert.equal(activeSkill(list, S2, now), 'other-session')
  assert.equal(activeSkill(list, 'nope', now), undefined)
  // 只有"刚好在窗口内"的一条时也能取到
  const fresh = [{ sessionId: S1, turn: 1, name: 'fresh', at: now - ACTIVE_WINDOW_MS + 1000 }]
  assert.equal(activeSkill(fresh, S1, now), 'fresh')
})

test('usageForTurn lists that turn\'s distinct skills', () => {
  const list = [
    { sessionId: S1, turn: 1, name: 'a', at: 1 },
    { sessionId: S1, turn: 1, name: 'a', at: 2 },
    { sessionId: S1, turn: 1, name: 'b', at: 3 },
    { sessionId: S1, turn: 2, name: 'c', at: 4 },
  ]
  assert.deepEqual(usageForTurn(list, S1, 1), ['a', 'b'])
  assert.deepEqual(usageForTurn(list, S1, 2), ['c'])
  assert.deepEqual(usageForTurn(list, S1, 9), [])
})

test('sessionSkillNames is distinct and newest-first', () => {
  const list = [
    { sessionId: S1, turn: 1, name: 'a', at: 1 },
    { sessionId: S1, turn: 2, name: 'b', at: 5 },
    { sessionId: S1, turn: 3, name: 'a', at: 9 },
  ]
  assert.deepEqual(sessionSkillNames(list, S1), ['a', 'b'])
})
