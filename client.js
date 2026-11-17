window.__ModuleLoader__.load({
  id: '@jacksun1994/dsh-skill-manager',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'skillManager'
    const SETTINGS_NS = 'skill-manager'
    const MODES = ['on', 'user', 'off']
    const SOURCES = ['project', 'user', 'custom', 'bundled', 'catalog', 'unknown']
    const WRITABLE = /(^|[\\/])\.(dsh|agents)[\\/]skills[\\/]/i

    //#region dictionaries
    const zh = {
      'nav': '技能',
      'title': '技能',
      'subtitle': '启用或禁用 agent 技能。改动会写入对应 SKILL.md 的 frontmatter，技能目录会在下一步刷新。',
      'mode.on': '全开',
      'mode.user': '仅用户',
      'mode.off': '已关闭',
      'hint.on': '模型可自动使用，输入框 / 列表可调用',
      'hint.user': '模型不可用，仅输入框 / 列表可调用',
      'hint.off': '模型与用户都看不到',
      'session': '会话',
      'refresh': '刷新',
      'loading': '读取中…',
      'writing': '写入中…',
      'empty': '没有发现技能',
      'empty.hint': '在 ~/.dsh/skills 或工作区 .dsh/skills 下放一个带 frontmatter 的 SKILL.md。',
      'noSession': '还没有会话',
      'noSession.hint': '打开或新建一个会话后，技能列表才能按它的工作目录读取。',
      'builtin': '内置（只读）',
      'count': '个技能',
      'error.noSettings': '设置服务不可用，无法写入技能状态。',
      'error.noEntry': '插件的配置项没有加载；重启会话或重新安装插件后再试。',
      'error.readonly': '当前 profile 不允许写入配置。',
      'error.generic': '操作失败',
      'footer': '只统计 ~/.dsh/skills、~/.agents/skills 与工作区 .dsh/skills、.agents/skills 下的技能。',
      'dock.skills': '技能',
      'dock.allOn': '全部开启',
      'dock.offSuffix': '已关闭',
      'dock.userSuffix': '仅用户',
      'dock.manage': '管理',
      'dock.collapse': '收起',
      'dock.enableAll': '全部恢复',
      'dock.readFailed': '技能读取失败',
      'popover.hint': '切换后立即生效，写入 SKILL.md 的 frontmatter',
      'popover.emptyShort': '没有发现技能',
      'popover.allOnShort': '全部开启',
      'menu.crashed': '技能菜单渲染失败',
      'search.placeholder': '搜索名称或描述',
      'search.none': '没有匹配的技能',
      'detail.back': '返回',
      'detail.path': '路径',
      'detail.size': '大小',
      'detail.mtime': '修改时间',
      'detail.description': '描述',
      'detail.descWarn': '描述超过 500 字符，模型目录里会被截断，可能影响这个技能被选中。',
      'detail.open': '查看全文',
      'detail.copyPath': '复制路径',
      'detail.copied': '已复制',
      'detail.edit': '让 agent 修改',
      'detail.archive': '让 agent 归档',
      'detail.editFile': '编辑',
      'detail.archiveFile': '归档',
      'detail.archiveConfirm': '确认归档',
      'detail.create': '新建',
      'detail.createHint': '在输入框里生成一条新建技能的请求',
      'detail.createRoot': '~/.dsh/skills/<名称>/SKILL.md（或本工作区 .dsh/skills/）',
      'editor.loading': '读取中…',
      'editor.saving': '保存中…',
      'editor.save': '保存',
      'editor.cancel': '取消',
      'editor.saved': '已保存',
      'editor.dirty': '有未保存的修改',
      'editor.backupHint': '保存前会把原文件备份成 .bak；磁盘上已被改动时拒绝覆盖。',
      'editor.create.title': '新建技能',
      'editor.create.name': '名称（kebab-case）',
      'editor.create.description': '描述（什么时候该用它）',
      'editor.create.hint': '会创建到 ~/.dsh/skills/<名称>/SKILL.md',
      'editor.create.submit': '创建',
      'usage.active': '使用中',
      'usage.session': '本会话用过',
      'usage.turn': '本次使用',
      'usage.usedTitle': '本会话用过这个技能',
      'undo': '撤销',
      'undo.hint': '撤销上一次切换',
      'open': '打开 SKILL.md',
      'receipt.none': '还没有写入记录',
      'receipt.ok': '上次写入',
      'receipt.failed': '失败',
      'source.project': '项目',
      'source.user': '用户',
      'source.custom': '自定义',
      'source.bundled': '内置',
      'source.catalog': '会话',
      'source.unknown': '未知',
      'entry.label': '技能',
    }

    const en = {
      'nav': 'Skills',
      'title': 'Skills',
      'subtitle': 'Enable or disable agent skills. Each change is written into the skill\'s SKILL.md frontmatter and the catalog refreshes on the next step.',
      'mode.on': 'On',
      'mode.user': 'User only',
      'mode.off': 'Off',
      'hint.on': 'The model may pick it up; / also lists it',
      'hint.user': 'Hidden from the model; / still lists it',
      'hint.off': 'Hidden from both the model and the / list',
      'session': 'Session',
      'refresh': 'Refresh',
      'loading': 'Reading…',
      'writing': 'Saving…',
      'empty': 'No skills found',
      'empty.hint': 'Add a SKILL.md with frontmatter under ~/.dsh/skills or a workspace .dsh/skills.',
      'noSession': 'No sessions yet',
      'noSession.hint': 'Open or start a session so the list can read that workspace\'s skills.',
      'builtin': 'Built-in (read-only)',
      'count': 'skills',
      'error.noSettings': 'The settings service is unavailable, so skill state cannot be written.',
      'error.noEntry': 'The plugin\'s configuration entry is not loaded. Restart the session or reinstall the plugin.',
      'error.readonly': 'This profile does not accept configuration writes.',
      'error.generic': 'The operation failed',
      'footer': 'Covers skills under ~/.dsh/skills, ~/.agents/skills, and a workspace\'s .dsh/skills and .agents/skills.',
      'dock.skills': 'Skills',
      'dock.allOn': 'all on',
      'dock.offSuffix': 'off',
      'dock.userSuffix': 'user only',
      'dock.manage': 'Manage',
      'dock.collapse': 'Collapse',
      'dock.enableAll': 'Turn all on',
      'dock.readFailed': 'Could not read skills',
      'popover.hint': 'Takes effect immediately; written to the skill SKILL.md frontmatter.',
      'popover.emptyShort': 'No skills found',
      'popover.allOnShort': 'all on',
      'menu.crashed': 'Skill menu failed to render',
      'search.placeholder': 'Search name or description',
      'search.none': 'No matching skills',
      'detail.back': 'Back',
      'detail.path': 'Path',
      'detail.size': 'Size',
      'detail.mtime': 'Modified',
      'detail.description': 'Description',
      'detail.descWarn': 'Over 500 characters: the model catalog truncates it, which can keep this skill from being picked.',
      'detail.open': 'View content',
      'detail.copyPath': 'Copy path',
      'detail.copied': 'Copied',
      'detail.edit': 'Ask the agent to edit',
      'detail.archive': 'Ask the agent to archive',
      'detail.editFile': 'Edit',
      'detail.archiveFile': 'Archive',
      'detail.archiveConfirm': 'Confirm archive',
      'detail.create': 'New',
      'detail.createHint': 'Draft a new-skill request in the composer',
      'detail.createRoot': '~/.dsh/skills/<name>/SKILL.md (or this workspace .dsh/skills/)',
      'editor.loading': 'Reading…',
      'editor.saving': 'Saving…',
      'editor.save': 'Save',
      'editor.cancel': 'Cancel',
      'editor.saved': 'Saved',
      'editor.dirty': 'Unsaved changes',
      'editor.backupHint': 'The previous file is copied to .bak before saving; a file changed on disk refuses the write.',
      'editor.create.title': 'New skill',
      'editor.create.name': 'Name (kebab-case)',
      'editor.create.description': 'Description (when to use it)',
      'editor.create.hint': 'Creates ~/.dsh/skills/<name>/SKILL.md',
      'editor.create.submit': 'Create',
      'usage.active': 'In use',
      'usage.session': 'Used in this session',
      'usage.turn': 'Skills used',
      'usage.usedTitle': 'This session already used it',
      'undo': 'Undo',
      'undo.hint': 'Undo the last switch',
      'open': 'Open SKILL.md',
      'receipt.none': 'No writes yet',
      'receipt.ok': 'Last write',
      'receipt.failed': 'failed',
      'source.project': 'Project',
      'source.user': 'User',
      'source.custom': 'Custom',
      'source.bundled': 'Bundled',
      'source.catalog': 'Session',
      'source.unknown': 'Unknown',
      'entry.label': 'Skills',
    }

    const ja = {
      ...en,
      'nav': 'スキル', 'title': 'スキル',
      'subtitle': 'エージェントスキルを有効化・無効化します。変更は SKILL.md の frontmatter に書き込まれ、次のステップでカタログが更新されます。',
      'mode.on': '有効', 'mode.user': 'ユーザーのみ', 'mode.off': '無効',
      'session': 'セッション', 'refresh': '更新', 'loading': '読み取り中…', 'writing': '保存中…',
      'empty': 'スキルが見つかりません', 'noSession': 'セッションがありません', 'builtin': '組み込み（読み取り専用）',
      'search.placeholder': '名前または説明で検索', 'search.none': '一致するスキルがありません',
      'undo': '元に戻す', 'undo.hint': '直前の切り替えを元に戻す', 'open': 'SKILL.md を開く',
      'receipt.ok': '前回の書き込み', 'receipt.failed': '失敗', 'receipt.none': 'まだ書き込みがありません',
      'source.project': 'プロジェクト', 'source.user': 'ユーザー', 'source.custom': 'カスタム', 'source.bundled': '組み込み', 'source.catalog': 'セッション', 'source.unknown': '不明',
      'menu.crashed': 'スキルメニューの描画に失敗しました',
      'entry.label': 'スキル',
    }

    const de = {
      ...en,
      'nav': 'Skills', 'title': 'Skills',
      'subtitle': 'Agent-Skills aktivieren oder deaktivieren. Änderungen landen im Frontmatter der SKILL.md; der Katalog aktualisiert sich im nächsten Schritt.',
      'mode.on': 'An', 'mode.user': 'Nur Benutzer', 'mode.off': 'Aus',
      'session': 'Sitzung', 'refresh': 'Aktualisieren', 'loading': 'Lesen…', 'writing': 'Speichern…',
      'empty': 'Keine Skills gefunden', 'noSession': 'Noch keine Sitzung', 'builtin': 'Eingebaut (schreibgeschützt)',
      'search.placeholder': 'Name oder Beschreibung suchen', 'search.none': 'Keine passenden Skills',
      'undo': 'Rückgängig', 'undo.hint': 'Letzten Wechsel rückgängig machen', 'open': 'SKILL.md öffnen',
      'receipt.ok': 'Letztes Schreiben', 'receipt.failed': 'fehlgeschlagen', 'receipt.none': 'Noch nichts geschrieben',
      'source.project': 'Projekt', 'source.user': 'Benutzer', 'source.custom': 'Eigene', 'source.bundled': 'Eingebaut', 'source.catalog': 'Sitzung', 'source.unknown': 'Unbekannt',
      'menu.crashed': 'Skill-Menü konnte nicht gerendert werden',
      'entry.label': 'Skills',
    }

    const es = { ...en, 'nav': 'Habilidades', 'title': 'Habilidades', 'loading': 'Leyendo…', 'refresh': 'Actualizar', 'search.placeholder': 'Buscar nombre o descripción', 'search.none': 'Sin habilidades coincidentes', 'undo': 'Deshacer', 'undo.hint': 'Deshacer el último cambio', 'receipt.ok': 'Última escritura', 'receipt.failed': 'fallidos', 'receipt.none': 'Aún sin escrituras', 'source.project': 'Proyecto', 'source.user': 'Usuario', 'source.custom': 'Personalizado', 'source.bundled': 'Integrado', 'source.catalog': 'Sesión', 'source.unknown': 'Desconocido', 'entry.label': 'Habilidades' }
    const fr = { ...en, 'nav': 'Compétences', 'title': 'Compétences', 'loading': 'Lecture…', 'refresh': 'Actualiser', 'search.placeholder': 'Rechercher nom ou description', 'search.none': 'Aucune compétence correspondante', 'undo': 'Annuler', 'undo.hint': 'Annuler le dernier changement', 'receipt.ok': 'Dernière écriture', 'receipt.failed': 'échecs', 'receipt.none': 'Aucune écriture', 'source.project': 'Projet', 'source.user': 'Utilisateur', 'source.custom': 'Personnalisé', 'source.bundled': 'Intégré', 'source.catalog': 'Session', 'source.unknown': 'Inconnu', 'entry.label': 'Compétences' }
    const pt = { ...en, 'nav': 'Habilidades', 'title': 'Habilidades', 'loading': 'Lendo…', 'refresh': 'Atualizar', 'search.placeholder': 'Pesquisar nome ou descrição', 'search.none': 'Nenhuma habilidade correspondente', 'undo': 'Desfazer', 'undo.hint': 'Desfazer a última alteração', 'receipt.ok': 'Última escrita', 'receipt.failed': 'falhas', 'receipt.none': 'Sem escritas ainda', 'source.project': 'Projeto', 'source.user': 'Usuário', 'source.custom': 'Personalizado', 'source.bundled': 'Embutido', 'source.catalog': 'Sessão', 'source.unknown': 'Desconhecido', 'entry.label': 'Habilidades' }
    const ru = { ...en, 'nav': 'Навыки', 'title': 'Навыки', 'loading': 'Чтение…', 'refresh': 'Обновить', 'search.placeholder': 'Поиск по имени или описанию', 'search.none': 'Подходящих навыков нет', 'undo': 'Отменить', 'undo.hint': 'Отменить последнее переключение', 'receipt.ok': 'Последняя запись', 'receipt.failed': 'ошибок', 'receipt.none': 'Записей пока нет', 'source.project': 'Проект', 'source.user': 'Пользователь', 'source.custom': 'Свои', 'source.bundled': 'Встроенные', 'source.catalog': 'Сессия', 'source.unknown': 'Неизвестно', 'entry.label': 'Навыки' }
    //#endregion

    /** Absolute-path test the host also enforces; used only to disable controls. */
    function looksWritable(path) {
      return typeof path === 'string' && path.toLowerCase().endsWith('.md') && WRITABLE.test(path)
    }

    function unwrap(result) {
      if (result && typeof result === 'object' && 'ok' in result) {
        if (result.ok === true) return result.value
        const error = result.error
        const message = error && typeof error === 'object' && typeof error.message === 'string' ? error.message : ''
        const code = error && typeof error === 'object' && typeof error.code === 'string' ? error.code : ''
        const thrown = new Error(message || code || 'remote failure')
        thrown.code = code
        throw thrown
      }
      return result
    }

    function remoteSettings(ctx) {
      try { return ctx.remote.settings } catch { return undefined }
    }

    function remoteSkills(ctx) {
      try { return ctx.remote.skills } catch { return undefined }
    }


    function useSessionSnapshot(sessions) {
      const [snapshot, setSnapshot] = React.useState(() => sessions.list.getSnapshot())
      React.useEffect(() => {
        const store = sessions.list
        const read = () => setSnapshot(store.getSnapshot())
        read()
        return store.subscribe(read)
      }, [sessions])
      return snapshot
    }

    function nameFromPath(path) {
      const parts = String(path ?? '').split(/[\\/]/).filter(Boolean)
      const file = parts.pop() ?? ''
      const stem = file.replace(/\.md$/i, '')
      if (/^skill$/i.test(stem) && parts.length > 0) return parts[parts.length - 1]
      return stem
    }

    function summarizeRows(rows) {
      const list = Array.isArray(rows) ? rows : []
      let on = 0
      let limited = 0
      let off = 0
      for (const row of list) {
        if (row?.mode === 'on') on += 1
        else if (row?.mode === 'user') limited += 1
        else off += 1
      }
      return { total: list.length, on, limited, off }
    }

    function filterRows(rows, query) {
      const list = Array.isArray(rows) ? rows : []
      const needle = String(query ?? '').trim().toLowerCase()
      if (needle === '') return list
      return list.filter((row) => `${row?.name ?? ''} ${row?.description ?? ''} ${row?.path ?? ''}`.toLowerCase().includes(needle))
    }

    /**
     * Join the host inventory (which includes hidden skills), the live catalog and
     * the recorded overrides into one sorted display list.
     */
    function buildRows(inventory, catalog, overrides) {
      const byPath = new Map()
      const put = (row) => {
        if (typeof row?.path !== 'string' || row.path === '') return
        byPath.set(row.path, { ...byPath.get(row.path), ...row })
      }
      for (const row of Array.isArray(inventory) ? inventory : []) {
        put({
          path: row.path,
          name: row.name ?? '',
          mode: MODES.includes(row.mode) ? row.mode : 'on',
          description: '',
          source: typeof row.source === 'string' && row.source !== '' ? row.source : 'unknown',
          writable: row.writable === true,
          // The info card reports these, so the inventory facts must survive the join.
          size: Number(row.size ?? 0),
          mtimeMs: Number(row.mtimeMs ?? 0),
        })
      }
      for (const row of Array.isArray(catalog) ? catalog : []) {
        if (typeof row?.path !== 'string') continue
        const known = byPath.get(row.path)
        put({
          path: row.path,
          name: row.name ?? '',
          mode: row.modelInvocable ? 'on' : 'user',
          description: row.description ?? '',
          source: known?.source ?? 'catalog',
          writable: known?.writable ?? false,
        })
      }
      for (const row of Array.isArray(overrides) ? overrides : []) {
        if (typeof row?.path !== 'string' || !MODES.includes(row.mode)) continue
        const existing = byPath.get(row.path)
        if (existing !== undefined) {
          existing.mode = row.mode
          if (!existing.name && row.name) existing.name = row.name
          continue
        }
        byPath.set(row.path, {
          path: row.path,
          name: row.name || nameFromPath(row.path),
          mode: row.mode,
          description: '',
          source: 'unknown',
          writable: false,
        })
      }
      return [...byPath.values()]
        .filter((row) => row.name !== '')
        .sort((left, right) => String(left.name).localeCompare(String(right.name)))
    }

    // ---- 技能使用记录（宿主从 tool/call 事件收集，这里只做展示用筛选） ----

    const ACTIVE_WINDOW_MS = 45 * 60 * 1000

    function usageRowsOf(usage, sessionId) {
      return (Array.isArray(usage) ? usage : []).filter((row) => row !== null && typeof row === 'object' && row.sessionId === sessionId)
    }

    function activeSkillName(usage, sessionId, now = Date.now()) {
      let best
      for (const row of usageRowsOf(usage, sessionId)) {
        if (typeof row.name !== 'string' || row.name === '') continue
        const at = Number(row.at ?? 0)
        if (!Number.isFinite(at) || now - at > ACTIVE_WINDOW_MS) continue
        if (best === undefined || at > Number(best.at ?? 0)) best = row
      }
      return best?.name
    }

    function sessionUsedNames(usage, sessionId) {
      const rows = usageRowsOf(usage, sessionId).slice().sort((left, right) => Number(right.at ?? 0) - Number(left.at ?? 0))
      const names = []
      for (const row of rows) {
        if (typeof row.name !== 'string' || row.name === '') continue
        if (!names.includes(row.name)) names.push(row.name)
      }
      return names
    }

    function turnUsedNames(usage, sessionId, turn) {
      const names = []
      for (const row of usageRowsOf(usage, sessionId)) {
        if (Number(row.turn) !== Number(turn)) continue
        if (typeof row.name !== 'string' || row.name === '') continue
        if (!names.includes(row.name)) names.push(row.name)
      }
      return names
    }
    function groupRows(rows, order = SOURCES) {
      const buckets = new Map()
      for (const row of Array.isArray(rows) ? rows : []) {
        const source = typeof row?.source === 'string' && row.source !== '' ? row.source : 'unknown'
        if (!buckets.has(source)) buckets.set(source, [])
        buckets.get(source).push(row)
      }
      const known = order.filter((source) => buckets.has(source))
      const extra = [...buckets.keys()].filter((source) => !order.includes(source)).sort()
      return [...known, ...extra].map((source) => ({ source, rows: buckets.get(source) }))
    }

    /** Read one session's skill inventory: host scan + session catalog + recorded overrides. */
    async function loadSkills(ctx, sessionId) {
      const settings = remoteSettings(ctx)
      if (settings === undefined) {
        const error = new Error('no-settings')
        error.code = 'no-settings'
        throw error
      }
      const view = unwrap(await settings.describe())
      if (view && view.writable === false) {
        const error = new Error('readonly')
        error.code = 'readonly'
        throw error
      }
      const entry = view && Array.isArray(view.namespaces) ? view.namespaces.find((item) => item.ns === SETTINGS_NS) : undefined
      if (entry === undefined) {
        const error = new Error('no-entry')
        error.code = 'no-entry'
        throw error
      }
      const overrides = Array.isArray(entry.value?.overrides) ? entry.value.overrides : []
      const inventory = Array.isArray(entry.value?.inventory) ? entry.value.inventory : []
      const usage = Array.isArray(entry.value?.usage) ? entry.value.usage : []
      const lastWrite = entry.value?.lastWrite && typeof entry.value.lastWrite === 'object' ? entry.value.lastWrite : undefined
      const skillsRemote = remoteSkills(ctx)
      let catalog = []
      if (sessionId !== undefined && skillsRemote !== undefined) {
        try {
          const value = unwrap(await skillsRemote.list({ sessionId }))
          catalog = Array.isArray(value?.skills) ? value.skills : []
        } catch {
          catalog = []
        }
      }
      return { rows: buildRows(inventory, catalog, overrides), revision: entry.revision, overrides, lastWrite, usage }
    }

    /** Write the complete override list: conflict-aware, retried once. */
    async function writeOverrides(ctx, entries) {
      const settings = remoteSettings(ctx)
      if (settings === undefined) throw new Error('no-settings')
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const view = unwrap(await settings.describe())
        const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
        if (entry === undefined) throw new Error('no-entry')
        try {
          unwrap(await settings.update(SETTINGS_NS, { overrides: entries }, entry.revision))
          return
        } catch (error) {
          const code = error && error.code
          const message = error instanceof Error ? error.message : ''
          const conflict = code === 'settings/conflict' || /changed since it was read/i.test(message)
          if (!conflict || attempt === 1) throw error
        }
      }
    }

    //#region store
    const EMPTY = Object.freeze({ status: 'idle', rows: [], error: undefined, busyPath: undefined, open: false, query: '', lastWrite: undefined, undo: undefined, detailPath: undefined, action: undefined, usage: [] })

    /**
     * Shared per-session inventory cache for the composer menu and the Settings
     * page. Snapshots are replaced on change so `useSyncExternalStore` can
     * compare them by identity.
     */
    function createStore(ctx) {
      const snapshots = new Map()
      const listeners = new Set()
      const inflight = new Map()
      const retries = new Map()

      const read = (sessionId) => snapshots.get(sessionId) ?? EMPTY
      const notify = () => { for (const listener of listeners) listener() }
      const set = (sessionId, patch) => {
        const next = { ...read(sessionId), ...patch }
        snapshots.set(sessionId, next)
        notify()
      }
      const subscribe = (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      }

      const load = async (sessionId) => {
        try {
          const result = await loadSkills(ctx, sessionId)
          retries.delete(sessionId)
          set(sessionId, {
            status: 'ready',
            rows: result.rows,
            revision: result.revision,
            overrides: result.overrides,
            lastWrite: result.lastWrite,
            usage: result.usage ?? [],
            error: undefined,
            busyPath: undefined,
          })
        } catch (error) {
          const code = error && error.code
          const message = code === 'no-settings' ? 'no-settings'
            : code === 'readonly' ? 'readonly'
              : code === 'no-entry' ? 'no-entry'
                : error instanceof Error ? (error.message || (error.name || 'Error') + '（无详情）') : String(error || '未知错误')
          set(sessionId, { status: 'error', error: message, busyPath: undefined })
          if (message === 'no-settings') {
            const attempt = (retries.get(sessionId) ?? 0) + 1
            retries.set(sessionId, attempt)
            if (attempt <= 3) setTimeout(() => { refresh(sessionId) }, 1500 * attempt)
          }
        }
      }

      const refresh = (sessionId) => {
        if (sessionId === undefined) return Promise.resolve()
        const pending = inflight.get(sessionId)
        if (pending !== undefined) return pending
        const current = read(sessionId)
        set(sessionId, { status: current.status === 'idle' ? 'loading' : 'ready', error: current.status === 'idle' ? undefined : current.error })
        const task = load(sessionId).finally(() => { inflight.delete(sessionId) })
        inflight.set(sessionId, task)
        return task
      }

      const ensure = (sessionId) => {
        if (sessionId === undefined) return
        if (read(sessionId).status !== 'idle') return
        refresh(sessionId)
      }

      /** Refresh a few times after a write so the watcher's catalog update lands. */
      const refreshSettled = async (sessionId, attempts = 3) => {
        for (let index = 0; index < attempts; index += 1) {
          if (index > 0) await new Promise((done) => setTimeout(done, 600))
          await load(sessionId)
        }
      }

      const setOpen = (sessionId, open) => {
        if (sessionId === undefined) return
        set(sessionId, { open, query: open ? '' : read(sessionId).query, detailPath: open ? read(sessionId).detailPath : undefined })
      }

      const setDetail = (sessionId, path) => {
        if (sessionId === undefined) return
        set(sessionId, { detailPath: path })
      }

      const setQuery = (sessionId, query) => {
        if (sessionId === undefined) return
        set(sessionId, { query })
      }

      const remember = (sessionId, row, mode, previousMode) => {
        set(sessionId, { undo: { path: row.path, name: row.name, from: previousMode, to: mode } })
      }

      const applyMode = async (sessionId, row, mode) => {
        const current = read(sessionId)
        if (current.busyPath !== undefined && current.busyPath !== '*') return
        const previousMode = row.mode
        set(sessionId, { busyPath: row.path, error: undefined, rows: current.rows.map((item) => (item.path === row.path ? { ...item, mode } : item)) })
        try {
          const view = unwrap(await remoteSettings(ctx).describe())
          const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
          const overrides = Array.isArray(entry?.value?.overrides) ? entry.value.overrides : []
          const next = overrides.filter((item) => item?.path !== row.path).concat([{ path: row.path, name: row.name, mode }])
          await writeOverrides(ctx, next)
          remember(sessionId, row, mode, previousMode)
          await refreshSettled(sessionId)
        } catch (error) {
          set(sessionId, { busyPath: undefined, error: error instanceof Error ? error.message : String(error) })
        }
      }

      const enableAll = async (sessionId) => {
        const current = read(sessionId)
        const targets = current.rows.filter((row) => row.writable && row.mode !== 'on')
        if (targets.length === 0) return
        set(sessionId, { busyPath: '*', error: undefined })
        try {
          const view = unwrap(await remoteSettings(ctx).describe())
          const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
          const overrides = Array.isArray(entry?.value?.overrides) ? entry.value.overrides : []
          const next = overrides
            .filter((item) => !targets.some((row) => row.path === item?.path))
            .concat(targets.map((row) => ({ path: row.path, name: row.name, mode: 'on' })))
          await writeOverrides(ctx, next)
          set(sessionId, { undo: undefined })
          await refreshSettled(sessionId)
        } catch (error) {
          set(sessionId, { busyPath: undefined, error: error instanceof Error ? error.message : String(error) })
        }
      }

      /** Reset every cached session (preset switch, plugin reload). */
      const reset = () => {
        snapshots.clear()
        inflight.clear()
        notify()
      }

      // ---- file operations: read / write / create / archive through the host ----

      const patchFile = (sessionId, patch) => {
        const file = read(sessionId).file
        if (file === undefined) return
        set(sessionId, { file: { ...file, ...patch } })
      }

      const closeFile = (sessionId) => {
        if (sessionId === undefined) return
        set(sessionId, { file: undefined, archivePath: undefined })
      }

      const openEditor = async (sessionId, row) => {
        if (sessionId === undefined) return
        set(sessionId, {
          file: {
            kind: 'edit', status: 'loading', path: row.path, name: row.name,
            content: '', savedContent: '', baseMtimeMs: 0, mtimeMs: Number(row.mtimeMs ?? 0),
            size: Number(row.size ?? 0), problems: [], error: undefined, savedAt: undefined,
          },
        })
        try {
          const result = await sendFileRequest(ctx, { id: fileRequestId(), op: 'read', path: row.path })
          if (result.ok !== true) throw new Error(result.message || '读取失败')
          const content = String(result.content ?? '')
          patchFile(sessionId, {
            status: 'ready',
            content,
            savedContent: content,
            baseMtimeMs: Number(result.mtimeMs ?? 0),
            mtimeMs: Number(result.mtimeMs ?? 0),
            size: Number(result.size ?? 0),
            error: undefined,
          })
        } catch (error) {
          patchFile(sessionId, { status: 'ready', error: errorText(error) })
        }
      }

      const updateEditor = (sessionId, content) => {
        if (sessionId === undefined) return
        const check = inspectDraftClient(content)
        patchFile(sessionId, { content, problems: check.problems, dirty: content !== (read(sessionId).file?.savedContent ?? '') })
      }

      const saveEditor = async (sessionId) => {
        if (sessionId === undefined) return
        const file = read(sessionId).file
        if (file === undefined || file.status === 'saving') return
        const check = inspectDraftClient(file.content)
        if (!check.ok) {
          patchFile(sessionId, { error: check.problems.join('；') })
          return
        }
        patchFile(sessionId, { status: 'saving', error: undefined })
        try {
          const result = await sendFileRequest(ctx, {
            id: fileRequestId(), op: 'write', path: file.path, content: file.content, baseMtimeMs: file.baseMtimeMs,
          })
          if (result.ok !== true) throw new Error(result.message || '保存失败')
          patchFile(sessionId, {
            status: 'ready',
            savedContent: file.content,
            dirty: false,
            baseMtimeMs: Number(result.mtimeMs ?? 0),
            mtimeMs: Number(result.mtimeMs ?? 0),
            size: Number(result.size ?? 0),
            savedAt: new Date().toISOString(),
            error: undefined,
          })
          await refresh(sessionId)
        } catch (error) {
          patchFile(sessionId, { status: 'ready', error: errorText(error) })
        }
      }

      const openCreate = (sessionId) => {
        if (sessionId === undefined) return
        set(sessionId, {
          file: {
            kind: 'create', status: 'ready', name: '', description: '', content: '',
            problems: [], error: undefined, rootLabel: '~/.dsh/skills/<名称>/SKILL.md',
          },
          detailPath: undefined,
        })
      }

      const updateCreate = (sessionId, patch) => {
        if (sessionId === undefined) return
        const file = read(sessionId).file
        if (file === undefined || file.kind !== 'create') return
        set(sessionId, { file: { ...file, ...patch } })
      }

      const submitCreate = async (sessionId) => {
        if (sessionId === undefined) return
        const file = read(sessionId).file
        if (file === undefined || file.kind !== 'create' || file.status === 'saving') return
        const checked = validateSkillNameClient(file.name)
        if (!checked.ok) {
          patchFile(sessionId, { error: checked.error })
          return
        }
        patchFile(sessionId, { status: 'saving', error: undefined })
        try {
          const result = await sendFileRequest(ctx, {
            id: fileRequestId(), op: 'create', name: checked.name, description: String(file.description ?? ''), root: '',
          })
          if (result.ok !== true) throw new Error(result.message || '创建失败')
          set(sessionId, { file: undefined })
          await refreshSettled(sessionId, 2)
        } catch (error) {
          patchFile(sessionId, { status: 'ready', error: errorText(error) })
        }
      }

      const requestArchive = (sessionId, path) => {
        if (sessionId === undefined) return
        set(sessionId, { archivePath: path })
      }

      const cancelArchive = (sessionId) => {
        if (sessionId === undefined) return
        set(sessionId, { archivePath: undefined })
      }

      const archiveSkill = async (sessionId) => {
        if (sessionId === undefined) return
        const path = read(sessionId).archivePath
        if (path === undefined) return
        set(sessionId, { archivePath: undefined })
        try {
          const result = await sendFileRequest(ctx, { id: fileRequestId(), op: 'archive', path })
          if (result.ok !== true) throw new Error(result.message || '归档失败')
          set(sessionId, {
            file: undefined,
            lastWrite: { at: new Date().toISOString(), ok: 1, failed: 0, error: '', archivedTo: String(result.archivedTo ?? '') },
          })
          await refreshSettled(sessionId, 2)
        } catch (error) {
          set(sessionId, { error: errorText(error) })
        }
      }

      return {
        read, subscribe, ensure, refresh, applyMode, enableAll, setOpen, setQuery, setDetail, reset,
        openEditor, updateEditor, saveEditor, closeFile, openCreate, updateCreate, submitCreate,
        requestArchive, cancelArchive, archiveSkill,
      }
    }

    function useSnapshot(store, sessionId) {
      const subscribe = React.useCallback((listener) => store.subscribe(listener), [store])
      const getSnapshot = React.useCallback(() => store.read(sessionId), [store, sessionId])
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    }
    //#endregion

    /** Best-effort: record a client-side failure in the plugin config so it can be inspected later. */
    function reportDiagnostic(ctx, kind, error) {
      const settings = remoteSettings(ctx)
      if (settings === undefined) return
      const detail = error instanceof Error
        ? `${error.name}: ${error.message} | ${String(error.stack ?? '').split('\n').slice(1, 3).join(' ')}`
        : String(error)
      const message = `${new Date().toISOString()} [${kind}] ${detail}`.slice(0, 1500)
      try {
        Promise.resolve(settings.describe()).then((view) => {
          const entry = unwrap(view)?.namespaces?.find((item) => item.ns === SETTINGS_NS)
          if (entry === undefined) return undefined
          return settings.update(SETTINGS_NS, { diagnostic: message }, entry.revision)
        }).catch(() => {})
      } catch {
        /* ignore */
      }
    }

    function SkillIcon(props) {
      const size = props.size ?? 14
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true,
        style: { display: 'block', flexShrink: 0, color: props.color ?? 'currentColor' },
      },
      h('rect', { x: 1.75, y: 3.25, width: 12.5, height: 9.5, rx: 2.4, stroke: 'currentColor', strokeWidth: 1.3 }),
      h('circle', { cx: 5.6, cy: 8, r: 1.65, fill: 'currentColor' }),
      h('path', { d: 'M9.6 6.6h2.6M9.6 8.4h2.6', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', opacity: 0.75 }))
    }

    function ChevronIcon(props) {
      return h('svg', {
        width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', 'aria-hidden': true,
        style: { display: 'block', flexShrink: 0, color: 'inherit' },
      },
      h('path', {
        d: 'M3 4.5L6 7.5L9 4.5', stroke: 'currentColor', strokeWidth: 1.5,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    //#region official style tokens
    // 与 @deepseek-ai/dsh-client-ui-primitives / ui-theme（0.2.2-rc.3）对齐的视觉常量：
    // 菜单材料（透明 + 背景模糊 + elevation 阴影）、圆角标准（R4/R8/R12/R16）、
    // 控制尺寸（chip 28、输入 32、按钮 sm 28 / md 36）与排版角色。
    const RADIUS_XS = 'var(--dsw-radius-xs)'
    const RADIUS_SM = 'var(--dsw-radius-sm)'
    const RADIUS_MD = 'var(--dsw-radius-md)'
    const RADIUS_LG = 'var(--dsw-radius-lg)'
    // 官方 select 的原生箭头替换（与 ui-settings-models 的 selectInput 同一个 data URI）。
    const SELECT_CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
    const MONO_FONT = 'var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)'
    // 官方 MenuSurface 材质：卡片本体无边框，描边由 elevation 阴影的第一层承担。
    const MENU_SURFACE = {
      border: 0,
      borderRadius: RADIUS_LG,
      background: 'var(--dsw-menu-surface-fill)',
      backdropFilter: 'var(--dsw-menu-backdrop-filter)',
      boxShadow: 'var(--dsw-elevation-prominent)',
      '--dsw-elevation-stroke-color': 'var(--dsw-alias-border-l1)',
      '--dsh-scrollbar-thumb': 'var(--dsw-alias-scrollbar-bg-l2)',
      '--dsh-scrollbar-thumb-hover': 'var(--dsw-alias-scrollbar-hover-l2)',
      color: 'var(--dsw-alias-label-primary)',
    }
    // 官方 Button：primary / secondary 两态，sm 为 28px 高、R8、12/18 排版。
    function controlButtonStyle(primary) {
      return {
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 28,
        padding: '0 10px',
        border: primary ? 'none' : '0.5px solid var(--dsw-alias-border-l3)',
        borderRadius: RADIUS_SM,
        background: primary ? 'var(--dsw-alias-button-primary-fill)' : 'transparent',
        color: primary ? 'var(--dsw-alias-label-primary-foreground)' : 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        cursor: 'pointer',
        flexShrink: 0,
      }
    }
    // 官方输入框：32px 高、R12、0.5px l4 描边、14/22 排版。
    function controlInputStyle(extra) {
      return {
        boxSizing: 'border-box',
        height: 32,
        padding: '0 10px',
        border: '0.5px solid var(--dsw-alias-border-l4)',
        borderRadius: RADIUS_MD,
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 14,
        lineHeight: '22px',
        ...extra,
      }
    }
    //#endregion

    /**
     * 三态切换：官方 SegmentedControl（ui-primitives 0.2.2-rc.3）。
     * 轨道是 --dsw-alias-interactive-bg-hover 的浅色底，选中项是一枚带
     * --dsw-elevation-soft 的滑片（bg-layer-1），不做品牌色填充。
     */
    function ModeSwitch(props) {
      const { mode, disabled, busy, t, onChange, compact } = props
      const selected = Math.max(0, MODES.indexOf(mode))
      const count = MODES.length
      const pad = compact ? 2 : 4
      const gap = 2
      const segRadius = compact ? RADIUS_XS : RADIUS_SM
      const track = {
        position: 'relative',
        display: 'inline-grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        gap,
        padding: pad,
        border: 0,
        borderRadius: compact ? RADIUS_SM : RADIUS_MD,
        background: 'var(--dsw-alias-interactive-bg-hover)',
        flexShrink: 0,
      }
      const indicator = {
        position: 'absolute',
        top: pad,
        left: pad,
        width: `calc((100% - ${pad * 2}px - ${gap * (count - 1)}px) / ${count})`,
        height: `calc(100% - ${pad * 2}px)`,
        border: 0,
        borderRadius: segRadius,
        background: 'var(--dsw-alias-bg-layer-1)',
        boxShadow: 'var(--dsw-elevation-soft)',
        transform: `translateX(calc(${selected} * (100% + ${gap}px)))`,
        transition: 'transform 160ms ease',
        pointerEvents: 'none',
      }
      return h('div', { role: 'group', style: track },
        h('span', { 'aria-hidden': true, style: indicator }),
        MODES.map((value) => {
          const active = mode === value
          return h('button', {
            key: value,
            type: 'button',
            'aria-pressed': active,
            disabled: disabled || busy,
            title: t(`hint.${value}`),
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              if (!active) onChange(value)
            },
            style: {
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 1,
              height: compact ? 22 : 28,
              padding: compact ? '0 8px' : '0 16px',
              border: 0,
              borderRadius: segRadius,
              background: 'transparent',
              color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
              font: 'inherit',
              fontSize: compact ? 11 : 13,
              lineHeight: compact ? '16px' : '20px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: disabled || busy ? 'default' : 'pointer',
              opacity: disabled ? 0.4 : 1,
            }
          }, t(`mode.${value}`))
        }))
    }

    /** 官方 Tag（outline）：0.5px l4 描边、R4、11/16 排版。 */
    function SourceBadge(props) {
      const { source, t } = props
      const label = t(`source.${SOURCES.includes(source) ? source : 'unknown'}`)
      return h('span', {
        style: {
          display: 'inline-flex', flexShrink: 0, alignItems: 'center',
          padding: '1px 6px', border: '0.5px solid var(--dsw-alias-border-l3)',
          borderRadius: RADIUS_XS, fontSize: 11, lineHeight: '16px',
          color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap',
        }
      }, label)
    }

    /**
     * 一行技能。`compact` 是 composer 弹层里的菜单行（34px 高、R12、5px 7px 内边距、
     * 13/20 排版），否则是设置页里的官方设置行（16px 0 内边距、底部 0.5px 分隔线、
     * 14/22 标题 + 12/18 描述）。
     */
    function SkillRow(props) {
      const { row, busy, disabled, t, onChange, compact, showPath, onOpen, used, last } = props
      const [hover, setHover] = React.useState(false)
      const interactive = typeof onOpen === 'function'
      const name = h('button', {
        type: 'button',
        title: interactive ? t('open') : row.name,
        onClick: () => { if (interactive) onOpen(row) },
        style: {
          appearance: 'none', border: 'none', background: 'transparent', padding: 0,
          font: 'inherit', textAlign: 'left', cursor: interactive ? 'pointer' : 'default',
          fontSize: compact ? 13 : 14, lineHeight: compact ? '20px' : '22px',
          fontWeight: compact ? 400 : 400, color: 'var(--dsw-alias-label-primary)',
          minWidth: 0, flexShrink: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }
      }, row.name)
      const nameLine = h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
        name,
        used
          ? h('span', {
            title: t('usage.usedTitle'),
            style: {
              width: 6, height: 6, borderRadius: '50%', cornerShape: 'round',
              background: 'var(--dsw-alias-state-business-primary)', flexShrink: 0,
            }
          })
          : null,
        h(SourceBadge, { source: row.source, t }),
        row.writable ? null : h('span', {
          style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)', flexShrink: 0 }
        }, t('builtin')))
      const switchEl = h(ModeSwitch, { mode: row.mode, disabled, busy, t, onChange, compact })
      if (compact) {
        return h('div', {
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          style: {
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 7px', borderRadius: RADIUS_MD,
            background: hover ? 'var(--dsw-alias-interactive-bg-hover)' : 'transparent',
          }
        },
        h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 } }, nameLine),
        switchEl)
      }
      return h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 0',
          borderBottom: last === true ? 'none' : '0.5px solid var(--dsw-alias-border-l2)',
        }
      },
      h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 } },
        nameLine,
        row.description
          ? h('div', {
            style: {
              fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }
          }, row.description)
          : null,
        showPath === false
          ? null
          : h('div', {
            title: row.path,
            style: {
              fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)',
              fontFamily: MONO_FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }
          }, row.path)),
      switchEl)
    }

    // 与 lib/drafts.js 保持同一份文案（客户端模块拿不到本地 ESM 导入）。
    function draftEdit(row) {
      return [
        `请修改技能 \`${row.name}\`（${row.path}）：`,
        '',
        '- 要改什么：',
        '- 为什么：',
        '',
        '改完请保留 frontmatter 里现有的调用开关（disable-model-invocation / user-invocable），并把 description 控制在 500 字符以内，最后给我改动摘要。',
      ].join('\n')
    }

    function draftArchive(row) {
      return [
        `请归档技能 \`${row.name}\`（${row.path}）：`,
        '',
        `1. 把它整体移动到同根目录下的 .archive/${row.name}-<时间戳>/；`,
        '2. 确认技能目录里已经看不到它；',
        '3. 告诉我归档后的路径，方便我以后恢复。',
      ].join('\n')
    }

    function draftCreate(rootLabel) {
      return [
        '请新建一个技能：',
        '',
        '- 名称（kebab-case）：',
        '- 什么时候该用它（触发场景）：',
        `- 放哪里：${rootLabel}`,
        '',
        'frontmatter 至少包含 name 和 description（description 用 "Use when…" 句式写清触发场景，控制在 500 字符以内），正文写清楚步骤、检查项与验证方法。',
      ].join('\n')
    }

    function formatBytes(size) {
      const value = Number(size ?? 0)
      if (!Number.isFinite(value) || value <= 0) return '—'
      if (value < 1024) return `${value} B`
      return `${(value / 1024).toFixed(1)} KB`
    }

    function formatTime(mtimeMs) {
      const value = Number(mtimeMs ?? 0)
      if (!Number.isFinite(value) || value <= 0) return '—'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
    }

    // ---- 与 lib/fileops.js 同义的客户端副本（本地 ESM 无法被客户端模块导入） ----

    function validateSkillNameClient(name) {
      const value = String(name ?? '').trim()
      if (value === '') return { ok: false, name: value, error: '名称不能为空' }
      if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(value)) return { ok: false, name: value, error: '用 kebab-case：小写字母、数字、短横线，2-64 字符' }
      return { ok: true, name: value }
    }

    function inspectDraftClient(text) {
      const value = String(text ?? '')
      const problems = []
      const size = new TextEncoder().encode(value).length
      if (size > 256 * 1024) problems.push('文档超过 256 KB')
      const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(value)
      if (!/^---\r?\n/.test(value)) problems.push('文档必须以 frontmatter（---）开头')
      if (front === null) problems.push('frontmatter 没有用 --- 闭合')
      else {
        if (!/^name:\s*\S+/m.test(front[1])) problems.push('frontmatter 缺少 name')
        if (!/^description:\s*\S+/m.test(front[1])) problems.push('frontmatter 缺少 description')
        const description = /^description:\s*(.+)$/m.exec(front[1])
        if (description !== null && description[1].length > 500) problems.push('description 超过 500 字符，模型目录会截断')
      }
      return { ok: problems.length === 0, problems, size }
    }

    function fileRequestId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    }

    const EMPTY_FILE_RESULT = Object.freeze({
      id: '', ok: false, op: '', path: '', message: '', conflict: false,
      content: '', size: 0, mtimeMs: 0, archivedTo: '', at: '',
    })

    /** Best-effort cleanup so a read result's document text does not linger in the config. */
    async function clearFileResult(ctx) {
      try {
        const settings = remoteSettings(ctx)
        if (settings === undefined) return
        const view = unwrap(await settings.describe())
        const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
        if (entry === undefined) return
        await settings.update(SETTINGS_NS, { result: { ...EMPTY_FILE_RESULT } }, entry.revision)
      } catch {
        /* best effort */
      }
    }

    const EMPTY_FILE_REQUEST = Object.freeze({ id: '', op: '', path: '', content: '', baseMtimeMs: 0, name: '', description: '', root: '' })

    /**
     * Ask the host to perform one file operation and wait for its result.
     * The request rides the plugin's volatile Configuration (the only Host↔Client
     * channel available here); `id` marks which result belongs to this call.
     */
    async function sendFileRequest(ctx, payload, timeoutMs = 15000) {
      const settings = remoteSettings(ctx)
      if (settings === undefined) throw new Error('设置服务不可用')
      const request = { ...EMPTY_FILE_REQUEST, ...payload }
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const view = unwrap(await settings.describe())
        const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
        if (entry === undefined) throw new Error('插件的配置项没有加载')
        try {
          unwrap(await settings.update(SETTINGS_NS, { request }, entry.revision))
          break
        } catch (error) {
          const message = error instanceof Error ? error.message : ''
          if (!/changed since it was read/i.test(message) || attempt === 1) throw error
        }
      }
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        await new Promise((done) => setTimeout(done, 250))
        const view = unwrap(await settings.describe())
        const entry = view?.namespaces?.find((item) => item.ns === SETTINGS_NS)
        const result = entry?.value?.result
        if (result !== null && typeof result === 'object' && result.id === request.id) {
          // 结果里可能带着整篇文件正文；消费后立刻清空，避免它长期留在 profile 配置里。
          void clearFileResult(ctx)
          return result
        }
      }
      throw new Error('宿主没有响应（超时）')
    }

    function errorText(error) {
      return error instanceof Error ? (error.message || (error.name || 'Error')) : String(error || '未知错误')
    }

    /**
     * Information card for one skill: what it is, where it lives, when the file
     * last changed, and the three "hand it to the agent" drafts. It never writes
     * files itself — the agent path keeps editing auditable.
     */
    function SkillDetail(props) {
      const { t, row, sessionId, store, actions, onBack, onClose } = props
      const [copied, setCopied] = React.useState(false)
      const description = String(row.description ?? '')
      const overLimit = description.length > 500

      const copyPath = () => {
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(row.path)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }
        } catch (error) {
          try { console.error('[skill-manager] copy failed:', error) } catch { /* ignore */ }
        }
      }

      const handOff = (text) => {
        try {
          if (!actions || typeof actions.setDraft !== 'function') return
          actions.setDraft(text)
          if (onClose) onClose()
        } catch (error) {
          try { console.error('[skill-manager] setDraft failed:', error) } catch { /* ignore */ }
        }
      }

      const openFile = () => {
        // 用内嵌编辑器展示全文：rc.3 的 Web profile 没有 sidebarRight 客户端服务，
        // 直接访问未 inject 的服务会让整段渲染抛错（按钮变警告色）。
        try {
          store.openEditor(sessionId, row)
          if (onClose) onClose()
        } catch (error) {
          try { console.error('[skill-manager] open file failed:', error) } catch { /* ignore */ }
        }
      }

      const field = (label, value, mono) => h('div', {
        style: { display: 'flex', gap: 8, fontSize: 12, lineHeight: '18px' }
      },
      h('span', { style: { width: 64, flexShrink: 0, color: 'var(--dsw-alias-label-tertiary)' } }, label),
      h('span', {
        style: {
          flex: 1, minWidth: 0, wordBreak: 'break-all',
          color: 'var(--dsw-alias-label-primary)',
          fontFamily: mono ? MONO_FONT : 'inherit',
        }
      }, value))

      const button = (label, onClick, primary) => h('button', {
        type: 'button',
        onClick,
        style: controlButtonStyle(primary),
      }, label)

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 10px 8px', overflowY: 'auto', flex: 1, minHeight: 0 } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          h('button', {
            type: 'button',
            onClick: onBack,
            style: {
              appearance: 'none', border: 'none', background: 'transparent', padding: 0,
              cursor: 'pointer', color: 'var(--dsw-alias-label-secondary)', font: 'inherit',
              fontSize: 12, lineHeight: '18px',
            }
          }, '‹ ' + t('detail.back')),
          h('span', { style: { flex: 1 } }),
          h(SourceBadge, { source: row.source, t }),
          row.writable ? null : h('span', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' } }, t('builtin'))),
        h('div', { style: { fontSize: 14, lineHeight: '22px', fontWeight: 500, color: 'var(--dsw-alias-label-primary)', wordBreak: 'break-all' } }, row.name),
        field(t('detail.path'), row.path, true),
        field(t('detail.size'), formatBytes(row.size)),
        field(t('detail.mtime'), formatTime(row.mtimeMs)),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 } },
          h('span', { style: { width: 64, color: 'var(--dsw-alias-label-tertiary)' } }, t('mode.on')),
          h(ModeSwitch, {
            mode: row.mode,
            disabled: row.writable !== true,
            busy: false,
            compact: true,
            t,
            path: row.path,
            onChange: (mode) => store.applyMode(sessionId, row, mode),
          })),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
          h('span', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' } }, t('detail.description') + ` · ${description.length}`),
          h('div', {
            style: {
              fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)',
              maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }
          }, description === '' ? '—' : description),
          overLimit
            ? h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-warn-label)' } }, t('detail.descWarn'))
            : null),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 } },
          button(t('detail.open'), openFile, false),
          button(copied ? t('detail.copied') : t('detail.copyPath'), copyPath, false),
          row.writable ? button(t('detail.editFile'), () => store.openEditor(sessionId, row), true) : null,
          row.writable
            ? (props.archiving === true
              ? button(t('detail.archiveConfirm'), () => store.archiveSkill(sessionId), true)
              : button(t('detail.archiveFile'), () => store.requestArchive(sessionId, row.path), false))
            : null),
        actions
          ? h('div', { style: { display: 'flex', gap: 8, paddingTop: 2 } },
            h('button', {
              type: 'button',
              onClick: () => handOff(draftEdit(row)),
              style: {
                appearance: 'none', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
                color: 'var(--dsw-alias-link)', font: 'inherit', fontSize: 12, lineHeight: '18px', fontWeight: 500,
              }
            }, t('detail.edit')))
          : null)

    }

    /**
     * In-app editor: a textarea for an existing SKILL.md, or a small form that
     * creates a new one. Saving goes through the host file-operation channel
     * (backup + mtime guard); the browser itself never writes files.
     */
    function SkillEditor(props) {
      const { t, sessionId, store, file } = props
      if (file === undefined) return null

      const frame = { display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 10px 8px', flex: 1, minHeight: 0 }
      const inputStyle = controlInputStyle({ width: '100%' })
      const textareaStyle = {
        ...inputStyle,
        height: 'auto',
        padding: '8px 10px',
        lineHeight: '22px',
        resize: 'vertical',
        fontFamily: 'inherit',
      }
      const buttonStyle = (primary) => controlButtonStyle(primary)

      if (file.kind === 'create') {
        return h('div', { style: frame },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            h('span', { style: { fontSize: 13, lineHeight: '20px', fontWeight: 500, color: 'var(--dsw-alias-label-primary)' } }, t('editor.create.title')),
            h('span', { style: { flex: 1 } }),
            h('button', { type: 'button', onClick: () => store.closeFile(sessionId), style: buttonStyle(false) }, t('editor.cancel'))),
          h('input', {
            type: 'text',
            value: file.name ?? '',
            placeholder: t('editor.create.name'),
            onChange: (event) => store.updateCreate(sessionId, { name: event.target.value }),
            style: inputStyle,
          }),
          h('textarea', {
            rows: 3,
            value: file.description ?? '',
            placeholder: t('editor.create.description'),
            onChange: (event) => store.updateCreate(sessionId, { description: event.target.value }),
            style: textareaStyle,
          }),
          h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' } }, t('editor.create.hint')),
          file.error ? h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-error-primary)', whiteSpace: 'pre-wrap' } }, file.error) : null,
          h('div', { style: { display: 'flex', gap: 6 } },
            h('button', {
              type: 'button',
              disabled: file.status === 'saving',
              onClick: () => store.submitCreate(sessionId),
              style: {
                ...buttonStyle(true),
                opacity: file.status === 'saving' ? 0.4 : 1,
                cursor: file.status === 'saving' ? 'default' : 'pointer',
              },
            }, file.status === 'saving' ? t('editor.saving') : t('editor.create.submit'))))
      }

      const problems = Array.isArray(file.problems) ? file.problems : []
      return h('div', { style: frame },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' } },
          h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500, fontSize: 13, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, file.name),
          h('span', { style: { flex: 1 } }),
          file.status === 'loading' ? h('span', null, t('editor.loading'))
            : file.status === 'saving' ? h('span', null, t('editor.saving'))
              : file.dirty ? h('span', null, t('editor.dirty'))
                : file.savedAt ? h('span', null, t('editor.saved')) : null),
        h('textarea', {
          value: file.content ?? '',
          onChange: (event) => store.updateEditor(sessionId, event.target.value),
          spellCheck: false,
          disabled: file.status === 'loading',
          style: {
            ...textareaStyle,
            flex: 1, minHeight: 150,
            fontFamily: MONO_FONT,
            fontSize: 12, lineHeight: '18px',
            whiteSpace: 'pre', overflow: 'auto',
          },
        }),
        problems.length > 0
          ? h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-warn-label)' } }, problems.join('；'))
          : null,
        file.error ? h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-error-primary)', whiteSpace: 'pre-wrap' } }, file.error) : null,
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          h('button', {
            type: 'button',
            disabled: file.status === 'saving' || file.status === 'loading',
            onClick: () => store.saveEditor(sessionId),
            style: {
              ...buttonStyle(true),
              opacity: file.status === 'saving' || file.status === 'loading' ? 0.4 : 1,
              cursor: file.status === 'saving' || file.status === 'loading' ? 'default' : 'pointer',
            },
          }, file.status === 'saving' ? t('editor.saving') : t('editor.save')),
          h('button', { type: 'button', onClick: () => store.closeFile(sessionId), style: buttonStyle(false) }, t('editor.cancel')),
          h('span', { style: { flex: 1 } }),
          h('span', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' } }, t('editor.backupHint'))))
    }

    /**
     * Turn tail: after a turn completes, list the skills that turn loaded.
     * Reads the host-recorded usage rows, so it also survives reloads.
     */
    function createTurnTail(ctx, store) {
      return function SkillTurnTail(props) {
        const t = props.t
        const sessionId = props.sessionId
        const snapshot = useSnapshot(store, sessionId)
        React.useEffect(() => { store.ensure(sessionId) }, [sessionId])

        const turn = props.turn && typeof props.turn === 'object' ? props.turn.turn : undefined
        if (typeof turn !== 'number') return null
        const names = turnUsedNames(snapshot.usage, sessionId, turn)
        if (names.length === 0) return null

        return h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            padding: '2px 0 4px', fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)',
          }
        },
        h(SkillIcon, { size: 12 }),
        h('span', null, t('usage.turn') + ':'),
        ...names.map((name) => h('span', {
          key: name,
          style: {
            padding: '1px 6px', borderRadius: '999px', cornerShape: 'round',
            border: '0.5px solid var(--dsw-alias-border-l4)', color: 'var(--dsw-alias-label-tertiary)',
          }
        }, name)))
      }
    }

    function ErrorLine(props) {
      const { error, t } = props
      if (error === undefined) return null
      const text = error === 'no-settings' ? t('error.noSettings')
        : error === 'readonly' ? t('error.readonly')
          : error === 'no-entry' ? t('error.noEntry')
            : error
      return h('div', { style: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-state-error-primary)', whiteSpace: 'pre-wrap' } }, text)
    }

    /** Keeps the composer button alive when the menu subtree fails to render. */
    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error, info) {
        try { console.error('[skill-manager] menu crashed:', error, info) } catch { /* ignore */ }
        try { if (typeof this.props.onError === 'function') this.props.onError(error) } catch { /* ignore */ }
      }

      render() {
        if (this.state.error !== null) return this.props.fallback(this.state.error)
        return this.props.children
      }
    }

    function ReceiptLine(props) {
      const { lastWrite, t } = props
      if (!lastWrite || typeof lastWrite.at !== 'string' || lastWrite.at === '') {
        return h('span', null, t('receipt.none'))
      }
      const time = new Date(lastWrite.at)
      const stamp = Number.isNaN(time.getTime()) ? lastWrite.at : time.toLocaleTimeString()
      const failed = Number(lastWrite.failed ?? 0)
      const ok = Number(lastWrite.ok ?? 0)
      return h('span', { style: { color: failed > 0 ? 'var(--dsw-alias-state-warn-primary)' : 'inherit' } },
        t('receipt.ok') + ': ' + stamp + ' · ' + String(ok) + (failed > 0 ? ' · ' + String(failed) + ' ' + t('receipt.failed') : ''))
    }

    //#region composer button + popover menu
    /**
     * Composer entry: a compact button that opens a menu above itself.
     * Rendered as a normal React child (no portal) and promoted to the top layer
     * with the native Popover API, falling back to absolute placement.
     */
    function createComposerButton(ctx, store) {
      const report = (kind, error) => { reportDiagnostic(ctx, kind, error) }
      function SkillButtonBody(props) {
        const t = props.t
        const sessionId = props.sessionId
        const actions = props.inputActions
        const snapshot = useSnapshot(store, sessionId)
        const buttonRef = React.useRef(null)
        const panelRef = React.useRef(null)
        const open = snapshot.open === true
        const [hover, setHover] = React.useState(false)
        const { limited, off, total } = summarizeRows(snapshot.rows)
        const activeName = activeSkillName(snapshot.usage, sessionId)
        const restricted = limited + off

        React.useEffect(() => { store.ensure(sessionId) }, [sessionId])

        const close = React.useCallback(() => { store.setOpen(sessionId, false) }, [sessionId])
        const editing = snapshot.file !== undefined

        React.useEffect(() => {
          try {
            const el = panelRef.current
            if (!open || !el) return undefined
            const rect = buttonRef.current && buttonRef.current.getBoundingClientRect
              ? buttonRef.current.getBoundingClientRect()
              : undefined
            const native = typeof el.showPopover === 'function'
            if (native) {
              el.setAttribute('popover', 'manual')
              try { el.showPopover() } catch { /* keep hidden */ }
            }
            el.style.visibility = 'visible'
            if (rect) {
              // 编辑态需要更宽更高；普通列表保持紧凑。
              const wide = editing
              const maxWidth = wide ? 620 : 400
              const preferred = wide ? 560 : 388
              el.style.left = `${Math.max(8, Math.min(rect.left, Math.max(8, window.innerWidth - maxWidth)))}px`
              el.style.width = `${Math.min(preferred, Math.max(260, window.innerWidth - 16))}px`
              el.style.maxHeight = `${Math.max(200, rect.top - 24)}px`
              if (native) {
                el.style.bottom = `${Math.max(8, window.innerHeight - rect.top + 8)}px`
                el.style.top = 'auto'
                el.style.right = 'auto'
              } else {
                el.style.bottom = 'calc(100% + 8px)'
              }
            }
            const onPointerDown = (event) => {
              const target = event.target
              if (target && target.closest && target.closest('[data-sm-panel]')) return
              if (buttonRef.current && buttonRef.current.contains && buttonRef.current.contains(target)) return
              close()
            }
            const onKeyDown = (event) => { if (event.key === 'Escape') close() }
            document.addEventListener('mousedown', onPointerDown, true)
            document.addEventListener('keydown', onKeyDown, true)
            return () => {
              document.removeEventListener('mousedown', onPointerDown, true)
              document.removeEventListener('keydown', onKeyDown, true)
              if (typeof el.hidePopover === 'function') {
                try { el.hidePopover() } catch { /* already closed */ }
              }
            }
          } catch (error) {
            try { console.error('[skill-manager] menu effect failed:', error) } catch { /* ignore */ }
            return undefined
          }
        }, [open, close, editing])

        const button = h('button', {
          ref: buttonRef,
          type: 'button',
          title: t('entry.label'),
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: () => { store.setOpen(sessionId, !open) },
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: 220, height: 28,
            padding: '0 4px 0 8px', border: 'none', borderRadius: RADIUS_SM,
            background: open || hover ? 'var(--dsw-alias-interactive-bg-hover)' : 'transparent',
            color: 'var(--dsw-alias-label-secondary)', font: 'inherit', fontSize: 13, lineHeight: '20px',
            fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }
        },
        h(SkillIcon, { size: 14 }),
        h('span', { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          activeName === undefined ? t('entry.label') : (t('entry.label') + ' · ' + activeName)),
        restricted > 0 || total > 0
          ? h('span', {
            style: {
              flexShrink: 0,
              fontSize: 11, lineHeight: '16px',
              color: restricted > 0 ? 'var(--dsw-alias-state-warn-label)' : 'var(--dsw-alias-label-caption)',
            }
          }, String(restricted > 0 ? restricted : total))
          : null,
        h('span', {
          style: {
            display: 'inline-flex', flexShrink: 0, color: 'var(--dsw-alias-label-caption)',
            transition: 'transform 120ms ease', transform: open ? 'rotate(180deg)' : 'none',
          }
        }, h(ChevronIcon)))

        if (!open) {
          return h('span', { style: { position: 'relative', display: 'inline-flex' } }, button)
        }

        const rows = filterRows(snapshot.rows, snapshot.query)
        const groups = groupRows(rows)
        const openDetail = (row) => { store.setDetail(sessionId, row.path) }
        const detailRow = snapshot.detailPath === undefined
          ? undefined
          : snapshot.rows.find((row) => row.path === snapshot.detailPath)

        const usedNames = sessionUsedNames(snapshot.usage, sessionId)
        const statusText = activeName !== undefined
          ? t('usage.active') + ': ' + activeName
          : snapshot.status === 'loading' && total === 0
          ? t('loading')
          : total === 0
            ? t('popover.emptyShort')
            : restricted === 0
              ? t('popover.allOnShort')
              : [off > 0 ? `${off} ${t('dock.offSuffix')}` : '', limited > 0 ? `${limited} ${t('dock.userSuffix')}` : ''].filter(Boolean).join(' · ')

        const menuAction = (label, onClick, options) => {
          const { title, primary, disabled } = options ?? {}
          return h('button', {
            type: 'button',
            title,
            disabled,
            onClick,
            style: {
              height: 24, padding: '0 6px', border: 0, borderRadius: RADIUS_SM,
              background: 'transparent',
              color: primary ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
              font: 'inherit', fontSize: 12, lineHeight: '18px',
              cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
              opacity: disabled ? 0.4 : 1,
            }
          }, label)
        }

        const header = h('div', {
          style: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px 4px', fontSize: 13, lineHeight: '20px' }
        },
        h(SkillIcon, { size: 14, color: 'var(--dsw-alias-label-secondary)' }),
        h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500 } }, t('entry.label')),
        h('span', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '· ' + total),
        h('span', {
          style: {
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)',
          }
        }, statusText),
        actions ? menuAction(t('detail.create'), () => store.openCreate(sessionId), { title: t('detail.createHint'), primary: true }) : null,
        snapshot.undo
          ? menuAction(t('undo'), () => {
            const target = snapshot.rows.find((row) => row.path === snapshot.undo.path)
            if (target !== undefined) store.applyMode(sessionId, target, snapshot.undo.from)
          }, { title: t('undo.hint'), disabled: snapshot.busyPath !== undefined })
          : null,
        restricted > 0
          ? menuAction(t('dock.enableAll'), () => store.enableAll(sessionId), { primary: true, disabled: snapshot.busyPath !== undefined })
          : null,
        menuAction(t('refresh'), () => store.refresh(sessionId), { title: t('refresh') }))

        const usageBar = usedNames.length === 0 ? null : h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
            padding: '0 8px 4px', fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)',
          }
        },
        h('span', null, t('usage.session') + ':'),
        ...usedNames.slice(0, 6).map((name) => h('span', {
          key: name,
          style: {
            padding: '1px 6px', borderRadius: '999px', cornerShape: 'round',
            border: '0.5px solid var(--dsw-alias-border-l4)', color: 'var(--dsw-alias-label-tertiary)',
          }
        }, name)),
        usedNames.length > 6 ? h('span', null, '+' + String(usedNames.length - 6)) : null)

        const search = h('div', { style: { padding: '2px 2px 3px' } },
          h('input', {
            type: 'search',
            value: snapshot.query ?? '',
            placeholder: t('search.placeholder'),
            onChange: (event) => store.setQuery(sessionId, event.target.value),
            style: {
              boxSizing: 'border-box', width: '100%', margin: 0,
              height: 30, padding: '0 8px', border: '0.5px solid transparent',
              borderRadius: RADIUS_MD, background: 'transparent',
              color: 'var(--dsw-alias-label-primary)', font: 'inherit',
              fontSize: 12, lineHeight: '18px', outline: 'none',
            }
          }))

        const list = rows.length === 0
          ? h('div', {
            style: { padding: '8px', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' }
          }, snapshot.status === 'loading' ? t('loading') : (total > 0 ? t('search.none') : t('popover.emptyShort')))
          : h('div', {
            style: { overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }
          },
            groups.flatMap((group, groupIndex) => [
              h('div', {
                key: `head-${group.source}`,
                style: {
                  padding: '6px 8px', fontSize: 11, lineHeight: '15px',
                  color: 'var(--dsw-alias-label-tertiary)',
                  marginTop: groupIndex === 0 ? 0 : 3,
                }
              }, t(`source.${SOURCES.includes(group.source) ? group.source : 'unknown'}`) + ' · ' + String(group.rows.length)),
              ...group.rows.map((row, rowIndex) => h(SkillRow, {
                key: row.path,
                row,
                compact: true,
                showPath: false,
                last: rowIndex === group.rows.length - 1,
                busy: snapshot.busyPath === row.path || snapshot.busyPath === '*',
                disabled: row.writable !== true,
                t,
                onOpen: openDetail,
                used: usedNames.includes(row.name),
                onChange: (mode) => store.applyMode(sessionId, row, mode),
              })),
            ]))

        const panel = h('div', {
          ref: panelRef,
          'data-sm-panel': '1',
          role: 'menu',
          style: {
            ...MENU_SURFACE,
            position: 'fixed', left: 8, bottom: 96, margin: 0, padding: 4,
            width: 388, maxHeight: 360,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            visibility: 'hidden', zIndex: 90,
          }
        },
        header,
        h(ErrorLine, { error: snapshot.error, t }),
        snapshot.file === undefined
          ? (detailRow === undefined
            ? h(React.Fragment, null, usageBar, search, list)
            : h(SkillDetail, {
              t,
              row: detailRow,
              sessionId,
              store,
              actions,
  
              archiving: snapshot.archivePath === detailRow.path,
              onBack: () => store.setDetail(sessionId, undefined),
              onClose: () => store.setOpen(sessionId, false),
            }))
          : h(SkillEditor, { t, file: snapshot.file, sessionId, store }),
        h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 3,
            padding: '3px 8px 4px', fontSize: 11, lineHeight: '16px',
            color: 'var(--dsw-alias-label-tertiary)',
            borderTop: '0.5px solid var(--dsw-alias-border-l2)',
          }
        },
        h(ReceiptLine, { lastWrite: snapshot.lastWrite, t }),
        h('span', { style: { flex: 1 } }),
        h('span', null, t('popover.hint'))))

        const crashed = (error) => h('div', {
          'data-sm-panel': '1',
          style: {
            ...MENU_SURFACE,
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 320, padding: '10px 12px',
            fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-error-primary)',
            whiteSpace: 'pre-wrap', zIndex: 90,
          }
        }, t('menu.crashed') + ': ' + String((error && (error.message || error)) || 'unknown'))

        return h('span', { style: { position: 'relative', display: 'inline-flex' } }, button, h(PanelBoundary, { fallback: crashed }, panel))
      }

      /**
       * 外层错误边界：渲染期任何异常都被兜住，**按钮永不消失**（降级成带提示的按钮），
       * 同时把异常上报给宿主（`diagnostic` 配置字段），方便没有控制台时定位。
       */
      return function ComposerSkillButton(props) {
        const fallback = (error) => h('button', {
          type: 'button',
          title: props.t('menu.crashed') + ': ' + String((error && (error.message || error)) || 'unknown'),
          style: {
            display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 8px',
            border: '0.5px solid var(--dsw-alias-state-warn-primary)', borderRadius: RADIUS_SM,
            background: 'transparent', color: 'var(--dsw-alias-state-warn-primary)',
            font: 'inherit', fontSize: 13, lineHeight: '20px', cursor: 'default', flexShrink: 0,
          }
        }, h(SkillIcon, { size: 14 }), h('span', null, props.t('entry.label')))

        return h(PanelBoundary, {
          fallback,
          onError: (error) => report('composer', error),
        }, h(SkillButtonBody, props))
      }
    }
    //#endregion

    //#region settings section
    function createSection(ctx, store) {
      return function SkillManagerSection(props) {
        const t = props.t
        const actions = props.inputActions
        const sessions = useSessionSnapshot(ctx.sessions)
        const [sessionId, setSessionId] = React.useState(undefined)
        const [detailPath, setDetailPath] = React.useState(undefined)
        const snapshot = useSnapshot(store, sessionId)
        const { off, limited } = summarizeRows(snapshot.rows)

        const sessionOptions = React.useMemo(() => {
          if (!sessions) return []
          const ids = Array.isArray(sessions.ids) ? sessions.ids : Object.keys(sessions.byId ?? {})
          return ids
            .map((id) => sessions.byId[id])
            .filter((row) => row !== undefined && row.origin !== 'subagent')
            .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0))
        }, [sessions])

        React.useEffect(() => {
          if (sessionId !== undefined) return
          const picked = pickSession(sessions)
          if (picked !== undefined) setSessionId(picked.id)
        }, [sessions, sessionId])

        React.useEffect(() => {
          if (sessionId === undefined) return
          if (snapshot.status === 'idle') store.ensure(sessionId)
        }, [sessionId, snapshot.status])

        const rows = filterRows(snapshot.rows, snapshot.query)
        const groups = groupRows(rows)
        const usedNames = sessionUsedNames(snapshot.usage, sessionId)

        const header = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          h('h2', { style: { margin: 0, fontSize: 18, lineHeight: '26px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, t('title')),
          h('p', { style: { margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' } }, t('subtitle')))

        const countText = snapshot.status === 'loading' && snapshot.rows.length === 0
          ? t('loading')
          : `${snapshot.rows.length} ${t('count')}${off + limited > 0 ? ` · ${off + limited} ${t('dock.offSuffix')}` : ''}`

        const toolbar = h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 } },
          sessionOptions.length > 1
            ? h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' } },
              t('session'),
              h('select', {
                value: sessionId ?? '',
                onChange: (event) => setSessionId(event.target.value),
                style: controlInputStyle({
                  maxWidth: 280, padding: '0 32px 0 10px', appearance: 'none', cursor: 'pointer',
                  backgroundImage: SELECT_CHEVRON,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '12px 12px',
                  fontSize: 13, lineHeight: '20px',
                })
              }, sessionOptions.map((row) => h('option', { key: row.id, value: row.id }, row.displayTitle ?? row.id))))
            : null,
          h('input', {
            type: 'search',
            value: snapshot.query ?? '',
            placeholder: t('search.placeholder'),
            onChange: (event) => store.setQuery(sessionId, event.target.value),
            style: controlInputStyle({ flex: '0 1 240px', minWidth: 180 })
          }),
          h('button', {
            type: 'button',
            onClick: () => store.refresh(sessionId),
            disabled: snapshot.status === 'loading',
            style: {
              ...controlButtonStyle(false),
              opacity: snapshot.status === 'loading' ? 0.4 : 1,
              cursor: snapshot.status === 'loading' ? 'default' : 'pointer',
            }
          }, t('refresh')),
          h('button', {
            type: 'button',
            onClick: () => store.openCreate(sessionId),
            title: t('detail.createHint'),
            style: controlButtonStyle(true),
          }, t('detail.create')),
          h('span', { style: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)', marginLeft: 'auto' } }, countText))

        let body
        const detailRow = detailPath === undefined ? undefined : snapshot.rows.find((row) => row.path === detailPath)
        // 官方设置卡材质：R16 卡片 + module 填充，细节面板/编辑器不再自带描边卡片。
        const moduleCard = {
          border: '0.5px solid var(--dsw-alias-settings-card-stroke)',
          borderRadius: RADIUS_LG,
          background: 'var(--dsw-alias-bg-module-platform)',
          display: 'flex', flexDirection: 'column', padding: 6,
        }
        if (snapshot.file !== undefined) {
          body = h('div', { style: { ...moduleCard, minHeight: 320 } }, h(SkillEditor, { t, file: snapshot.file, sessionId, store }))
        } else if (detailRow !== undefined) {
          body = h('div', { style: { ...moduleCard, maxHeight: 420 } }, h(SkillDetail, {
            t,
            row: detailRow,
            sessionId,
            store,
            actions,

            archiving: snapshot.archivePath === detailRow.path,
            onBack: () => setDetailPath(undefined),
            onClose: () => setDetailPath(undefined),
          }))
        } else if (sessionOptions.length === 0) {
          body = h('div', { style: { padding: '12px 0', fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' } },
            h('div', { style: { marginBottom: 4, color: 'var(--dsw-alias-label-primary)' } }, t('noSession')),
            t('noSession.hint'))
        } else if (snapshot.status === 'loading' && snapshot.rows.length === 0) {
          body = h('div', { style: { padding: '12px 0', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' } }, t('loading'))
        } else if (rows.length === 0) {
          body = h('div', { style: { padding: '12px 0', fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-tertiary)' } },
            h('div', { style: { marginBottom: 4, color: 'var(--dsw-alias-label-primary)' } },
              snapshot.rows.length > 0 ? t('search.none') : (snapshot.error === undefined ? t('empty') : t('dock.readFailed'))),
            snapshot.rows.length > 0 ? null : (snapshot.error === undefined ? t('empty.hint') : h(ErrorLine, { error: snapshot.error, t })))
        } else {
          body = h('div', { style: { display: 'flex', flexDirection: 'column' } },
            groups.flatMap((group, groupIndex) => [
              h('div', {
                key: `head-${group.source}`,
                style: {
                  margin: 0,
                  marginTop: groupIndex === 0 ? 0 : 20,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--dsw-alias-label-tertiary)',
                }
              }, t(`source.${SOURCES.includes(group.source) ? group.source : 'unknown'}`) + ' · ' + String(group.rows.length)),
              ...group.rows.map((row, rowIndex) => h(SkillRow, {
                key: row.path,
                row,
                last: rowIndex === group.rows.length - 1,
                busy: snapshot.busyPath === row.path || snapshot.busyPath === '*',
                disabled: row.writable !== true,
                t,
                onOpen: (target) => setDetailPath(target.path),
                used: usedNames.includes(row.name),
                onChange: (mode) => store.applyMode(sessionId, row, mode),
              })),
            ]))
        }

        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 0 28px', maxWidth: 760 } },
          header,
          toolbar,
          h(ErrorLine, { error: snapshot.error, t }),
          body,
          h('div', {
            style: {
              display: 'flex', gap: 8, fontSize: 11, lineHeight: '16px',
              color: 'var(--dsw-alias-label-tertiary)',
              borderTop: '0.5px solid var(--dsw-alias-border-l2)', paddingTop: 10,
            }
          },
          h(ReceiptLine, { lastWrite: snapshot.lastWrite, t }),
          h('span', { style: { flex: 1 } }),
          h('span', null, t('footer'))))
      }
    }
    //#endregion

    return {
      // dsh 0.2.2-rc.3 起 Client Remote 命名空间是独立子 Service，必须显式 inject。
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.settings', 'remote.skills'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, de, es, fr, pt, ru }), 'skill-manager: dictionaries')
        const t = ctx.locale.bind(NS)
        const store = createStore(ctx)

        // 技能按 preset 分层：切 preset 后目录会变，缓存必须失效。
        ctx.effect(() => {
          const remote = ctx.get('remote')
          if (!remote || typeof remote.$on !== 'function') return undefined
          const off = remote.$on('agent-preset/selected', () => store.reset())
          return () => { if (typeof off === 'function') off() }
        }, 'skill-manager: preset change')

        // 页面级兜底：任何提到本插件的未捕获异常都记进 `diagnostic`，便于事后定位。
        ctx.effect(() => {
          if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined
          const mine = (text) => /skill-manager|skillManager/.test(String(text ?? ''))
          const onError = (event) => {
            if (mine(`${event?.message ?? ''} ${event?.filename ?? ''}`)) reportDiagnostic(ctx, 'window', event?.error ?? event?.message)
          }
          const onRejection = (event) => {
            const reason = event?.reason
            const text = reason instanceof Error ? String(reason.stack ?? reason.message) : String(reason)
            if (mine(text)) reportDiagnostic(ctx, 'rejection', reason)
          }
          window.addEventListener('error', onError)
          window.addEventListener('unhandledrejection', onRejection)
          return () => {
            window.removeEventListener('error', onError)
            window.removeEventListener('unhandledrejection', onRejection)
          }
        }, 'skill-manager: diagnostics')

        const Button = createComposerButton(ctx, store)
        ctx.effect(() => ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left',
          id: 'skills',
          order: 2,
          label: () => t('entry.label'),
        }, (props) => h(Button, { ...props, t }))), 'skill-manager: composer button')

        const TurnTail = createTurnTail(ctx, store)
        ctx.effect(() => ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
          name: 'conversation.chat.turnTail',
          id: 'skills',
          order: 30,
          label: () => t('usage.turn'),
        }, (props) => h(TurnTail, { ...props, t }))), 'skill-manager: turn tail')

        const Section = createSection(ctx, store)
        ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'skills',
          order: 18,
          label: () => t('nav'),
          locale: NS,
        }, (props) => h(Section, { ...props, t }))), 'skill-manager: settings section')
      },
    }
  },
})




















