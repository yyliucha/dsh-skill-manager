/**
 * 本轮技能读数的浏览器侧测试。
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

/** 把插件挂到桩上下文，取回输入框下方那条读数。 */
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
  assert.ok(entry, '会注册到转录末尾那一行')
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

/** 深度优先找第一个满足条件的元素。 */
function findElement(node, predicate) {
  if (node === null || node === undefined || typeof node !== 'object') return undefined
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (node.type !== undefined && predicate(node)) return node
  if (!Array.isArray(node.children)) return undefined
  for (const child of node.children) {
    const found = findElement(child, predicate)
    if (found !== undefined) return found
  }
  return undefined
}

/** 指认读数本体：带 data-skill-activity 的那个元素。 */
const isReading = (element) => element.props !== undefined && element.props['data-skill-activity'] !== undefined

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
const steering = { kind: 'steering', messageId: 'm1', seq: 2, time: 2, content: [], source: { kind: 'user' } }
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

test('这一轮没加载技能就不占位置', () => {
  assert.equal(render([user, otherResult], []), null)
})

test('已加载的技能会被点名', () => {
  const tree = render([user, skillResult('dsh-doc')], [])
  const pill = findElement(tree, isReading)
  assert.equal(pill.type, 'span', '只有一个技能时不可点')
  assert.equal(pill.props['data-skill-activity'], 'loaded')
  assert.equal(pill.props['data-skill-name'], 'dsh-doc')
  assert.equal(pill.props['data-skill-count'], '1')
  assert.deepEqual(textOf(pill), ['技能', '·', 'dsh-doc'])
  assert.equal(findElement(tree, (element) => element.type === 'button'), undefined)
})

test('加载中的技能会点名并标成 loading', () => {
  const tree = render([user], [runningSkill('sh2-print-field-troubleshoot')])
  const pill = findElement(tree, isReading)
  assert.equal(pill.props['data-skill-activity'], 'loading')
  assert.equal(pill.props['data-skill-name'], 'sh2-print-field-troubleshoot')
  assert.deepEqual(textOf(pill), ['正在加载技能', '·', 'sh2-print-field-troubleshoot'])
})

test('名字还没流到就先只说正在加载', () => {
  const tree = render([user], [runningSkill(undefined)])
  const pill = findElement(tree, isReading)
  assert.equal(pill.props['data-skill-activity'], 'loading')
  assert.deepEqual(textOf(pill), ['正在加载技能'])
})

test('本轮多个技能只占一个读数，点名最新并带计数', () => {
  const tree = render([user, skillResult('alpha'), skillResult('beta')], [])
  const pill = findElement(tree, isReading)
  assert.equal(pill.type, 'button', '多个技能可以点开清单')
  assert.equal(pill.props['data-skill-count'], '2')
  assert.equal(pill.props['aria-expanded'], false)
  assert.equal(pill.props['aria-haspopup'], 'dialog')
  assert.deepEqual(textOf(pill), ['技能', '·', 'beta', '+1'])
  assert.match(pill.props.title, /alpha \(已加载\)/)
  assert.match(pill.props.title, /beta \(已加载\)/)
})

test('上一轮加载过的技能不留在本轮读数里', () => {
  assert.equal(render([user, skillResult('old-skill'), user, otherResult], []), null)
})

test('steering 打断仍然属于本轮', () => {
  const tree = render([user, skillResult('dsh-doc'), steering, otherResult], [])
  assert.deepEqual(textOf(findElement(tree, isReading)), ['技能', '·', 'dsh-doc'])
})

test('同一个技能重复加载只算一次', () => {
  const tree = render([user, skillResult('alpha'), skillResult('alpha')], [])
  const pill = findElement(tree, isReading)
  assert.equal(pill.props['data-skill-count'], '1')
  assert.deepEqual(textOf(pill), ['技能', '·', 'alpha'])
})

test('加载失败不冒充已加载', () => {
  assert.equal(render([user, skillResult('broken', { isError: true })], []), null)
})

test('别的工具和坏节点都不影响读数', () => {
  const broken = { kind: 'tool-result', name: 'skill', args: null, call: null, isError: false }
  assert.equal(render([user, otherResult, broken], [null]), null)
})
