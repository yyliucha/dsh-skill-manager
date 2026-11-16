import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rootsFor, scanRoots } from '../lib/scan.js'

const DOC = (name, mode = 'on') => {
  const lines = ['---', `name: ${name}`, `description: ${name} skill`, '---', '', '# body', '']
  if (mode === 'user') lines.splice(3, 0, 'disable-model-invocation: true')
  if (mode === 'off') lines.splice(3, 0, 'disable-model-invocation: true', 'user-invocable: false')
  return lines.join('\n')
}

test('rootsFor orders project → custom → user → bundled and de-duplicates', async () => {
  const home = 'C:\\home'
  const dir = 'F:\\work'
  const roots = rootsFor({ home, dir, bundled: 'C:\\bundle', custom: ['C:\\custom', 'C:\\custom'] })
  assert.deepEqual(roots.map((root) => root.source), ['project', 'project', 'custom', 'user', 'user', 'bundled'])
})

test('scanRoots reads modes, sources and precedence from disk', async () => {
  const base = await mkdtemp(join(tmpdir(), 'sm-scan-'))
  try {
    const projectRoot = join(base, 'project', '.dsh', 'skills')
    const userRoot = join(base, 'home', '.dsh', 'skills')
    await mkdir(join(projectRoot, 'alpha'), { recursive: true })
    await mkdir(join(projectRoot), { recursive: true })
    await mkdir(join(userRoot, 'beta'), { recursive: true })
    await writeFile(join(projectRoot, 'alpha', 'SKILL.md'), DOC('alpha'), 'utf8')
    await writeFile(join(userRoot, 'beta', 'SKILL.md'), DOC('beta', 'off'), 'utf8')
    // 同名 skill：项目根排在前，应当赢
    await writeFile(join(userRoot, 'alpha', 'SKILL.md').replace('alpha', 'alpha'), DOC('alpha', 'user'), 'utf8').catch(() => {})
    await mkdir(join(userRoot, 'alpha'), { recursive: true })
    await writeFile(join(userRoot, 'alpha', 'SKILL.md'), DOC('alpha', 'user'), 'utf8')
    // 平铺条目 + 无 frontmatter 的文件
    await writeFile(join(userRoot, 'flat-skill.md'), DOC('flat-skill', 'user'), 'utf8')
    await writeFile(join(userRoot, 'notes.md'), '# not a skill\n', 'utf8')

    const roots = rootsFor({ home: join(base, 'home'), dir: join(base, 'project') })
    const rows = await scanRoots(roots)
    const byName = new Map(rows.map((row) => [row.name, row]))

    assert.deepEqual([...byName.keys()], ['alpha', 'beta', 'flat-skill'])
    assert.equal(byName.get('alpha').source, 'project', 'project root wins a duplicate name')
    assert.equal(byName.get('alpha').mode, 'on')
    assert.equal(byName.get('beta').mode, 'off')
    assert.equal(byName.get('beta').source, 'user')
    assert.equal(byName.get('flat-skill').mode, 'user')
    assert.equal(byName.get('flat-skill').writable, true)
    assert.ok(byName.get('beta').size > 0, 'size is reported')
    assert.ok(byName.get('beta').mtimeMs > 0, 'mtime is reported')
    assert.equal(byName.get('notes'), undefined, 'files without frontmatter are ignored')
  } finally {
    await rm(base, { recursive: true, force: true })
  }
})

test('scanRoots tolerates missing roots', async () => {
  const rows = await scanRoots([{ path: join(tmpdir(), 'definitely-missing-sm-root'), source: 'user' }])
  assert.deepEqual(rows, [])
})

