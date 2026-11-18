/**
 * 会话技能读数的浏览器侧测试。
 *
 * client.js 是一个 `window.__ModuleLoader__` 注册，所以这里挂一个假加载器、
 * 用桩 React 调真实工厂、再把插件 apply 到桩 Client 上下文上，取到注册到
 * `conversation.input.dock` 的那个组件直接渲染断言。不跑 DOM、不跑真 React。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const CLIENT_PATH = fileURLToPath(new URL('../client.js', import.meta.url))
const CLIENT_SOURCE = readFileSync(CLIENT_PATH, 'utf8')

/** client.js 在定义阶段会碰到的 React 面。 */
function createReactStub() {
  class Component {
    constructor(props) { this.props = props }
    setState() {}
  }
  return {
    Component,
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    Fragment: 'Fragment',
    useMemo: (factory) => factory(),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
  }
}

/** 加载真实注册，返回插件与桩 React。 */
function loadPlugin() {
  let registration
  const noop = () => {}
  const context = {
    window: { __ModuleLoader__: { load: (spec) => { registration = spec } }, addEventListener: noop, removeEventListener: noop },
    console,
    setTimeout,
    clearTimeout,
  }
  vm.runInNewContext(CLIENT_SOURCE, context, { filename: CLIENT_PATH })
  assert.ok(registration, '模块会把自己注册进加载器')
  const react = createReactStub()
  const require = () => react
  const plugin = registration.factory(require)
  return { plugin, react }
}

const { plugin } = loadPlugin()

/** 把插件挂到桩上下文，取回转录末尾那条读数。 */
function readingEntry() {
  const entries = []
  let dictionaries
  const ctx = {
    effect: (register) => register(),
    on: () => () => {},
    get: () => undefined,
    locale: {
      register: (ns, dicts) => { dictionaries = dicts; return () => {} },
      bind: () => (key, vars) => {
        const template = (dictionaries && dictionaries.zh && dictionaries.zh[key]) ?? key
        return vars === undefined ? template : template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name]))
      },
    },
    slots: {
      inject: (name, callback) => callback(),
      register: (options, component) => {
        entries.push({ options, component })
        return () => {}
      },
    },
    sessions: {},
    remote: {},
  }
  plugin.apply(ctx)
  const entry = entries.find((item) => item.options.name === 'conversation.input.dock')
  assert.ok(entry, '会注册到转录末尾那行')
  return entry
}

/** 逐层解开函数组件，拿到最终元素树。 */
function resolveElement(tree) {
  let current = tree
  while (current !== null && typeof current === 'object' && typeof current.type === 'function') {
    current = current.type(current.props)
  }
  return current
}

/** 渲染读数。 */
function render(nodes, running) {
  const entry = readingEntry()
  const useChat = (selector) => selector({ legacy: { nodes, runningCalls: running } })
  return resolveElement(entry.component({ useChat }))
}

/** 拍平成一串可见文本。 */
function textOf(node) {
  if (node === null || node === undefined || node === false) return []
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap((child) => textOf(child))
  if (typeof node === 'object' && Array.isArray(node.children)) return node.children.flatMap((child) => textOf(child))
  return []
}

/** 收集所有技能 chip。 */
function chipsOf(tree) {
  const found = []
  const walk = (node) => {
    if (node === null || node === undefined || typeof node !== 'object') return
    if (Array.isArray(node)) { for (const child of node) walk(child); return }
    if (node.props !== undefined && node.props['data-skill-activity'] !== undefined) { found.push(node); return }
    if (Array.isArray(node.children)) for (const child of node.children) walk(child)
  }
  walk(tree)
  return found
}

/** 造参数视图：与 PartialArguments 一样按 key 取值。 */
function argsOf(value) {
  return { value: (key) => (Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined) }
}

function skillResult(name, overrides = {}) {
  return {
    kind: 'tool-result',
    seq: 10,
    time: 1000,
    callId: 'call-' + name,
    callTime: 900,
    name: 'skill',
    args: argsOf({ name }),
    call: { name: 'skill', argsRaw: JSON.stringify({ name }) },
    content: [],
    isError: false,
    subCalls: [],
    ...overrides,
  }
}

function runningSkill(name) {
  return { callId: 'running', name: 'skill', phase: 'preparing', args: argsOf(name === undefined ? {} : { name }), turn: 1, step: 1, time: 2000, subCalls: [] }
}

const user = { kind: 'user', seq: 1, time: 1, content: [], source: { kind: 'user' } }
const otherResult = {
  kind: 'tool-result', seq: 11, time: 1100, callId: 'call-grep', callTime: 1050, name: 'grep',
  args: argsOf({ pattern: 'x' }), call: { name: 'grep', argsRaw: '{"pattern":"x"}' }, content: [], isError: false, subCalls: [],
}

test('读数注册为转录末尾的一行，排在待办和排队消息之前', () => {
  const entry = readingEntry()
  assert.equal(entry.options.id, 'skill-activity')
  assert.equal(entry.options.order, -1)
  assert.equal(entry.options.locale, 'skillManager')
})

test('没有会话快照座位时什么都不画', () => {
  const entry = readingEntry()
  assert.equal(resolveElement(entry.component({})), null)
})

test('这个会话还没加载过技能就不占位置', () => {
  assert.equal(render([user, otherResult], []), null)
})

test('一个技能一个 chip，常驻显示', () => {
  const tree = render([user, skillResult('dsh-doc')], [])
  const chips = chipsOf(tree)
  assert.equal(chips.length, 1)
  assert.equal(chips[0].props['data-skill-name'], 'dsh-doc')
  assert.equal(chips[0].props['data-skill-activity'], 'loaded')
  assert.deepEqual(textOf(tree), ['技能', 'dsh-doc'])
})

test('多个技能各占一个 chip，不折叠、不隐藏', () => {
  const tree = render([user, skillResult('alpha'), skillResult('beta'), skillResult('gamma')], [])
  const chips = chipsOf(tree)
  assert.deepEqual(chips.map((chip) => chip.props['data-skill-name']), ['alpha', 'beta', 'gamma'])
  assert.deepEqual(textOf(tree), ['技能', 'alpha', 'beta', 'gamma'])
  assert.equal(chips.some((chip) => chip.type === 'button'), false, '不再有折叠按钮/弹层')
})

test('加载中的技能在 chip 上标出来', () => {
  const tree = render([user, skillResult('alpha')], [runningSkill('beta')])
  const chips = chipsOf(tree)
  assert.deepEqual(chips.map((chip) => [chip.props['data-skill-name'], chip.props['data-skill-activity']]), [
    ['alpha', 'loaded'],
    ['beta', 'loading'],
  ])
  assert.deepEqual(textOf(tree), ['技能', 'alpha', 'beta'])
})

test('名字还没流到时先给一个占位 chip', () => {
  const tree = render([user], [runningSkill(undefined)])
  const chips = chipsOf(tree)
  assert.equal(chips.length, 1)
  assert.equal(chips[0].props['data-skill-activity'], 'loading')
  assert.deepEqual(textOf(tree), ['技能', '正在加载技能'])
})

test('上一轮用过的技能仍然常驻显示', () => {
  const tree = render([user, skillResult('old-skill'), user, otherResult], [])
  assert.deepEqual(chipsOf(tree).map((chip) => chip.props['data-skill-name']), ['old-skill'])
})

test('同一个技能只占一个 chip', () => {
  const tree = render([user, skillResult('alpha'), skillResult('alpha')], [])
  assert.equal(chipsOf(tree).length, 1)
})

test('加载失败不冒充已加载', () => {
  assert.equal(render([user, skillResult('broken', { isError: true })], []), null)
})

test('别的工具和坏节点都不影响读数', () => {
  const broken = { kind: 'tool-result', name: 'skill', args: null, call: null, isError: false }
  assert.equal(render([user, otherResult, broken], [null]), null)
})
