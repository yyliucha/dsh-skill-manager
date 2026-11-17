# dsh-skill-switcher

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that turns each agent skill's invocation state into a one-click switch — **On / User only / Off** — from the composer tool row and a Settings page, changing only the two invocation fields in the skill's `SKILL.md`.

English | [中文](#中文)

## What it does

| Mode | Model catalog | `/` list | SKILL.md frontmatter |
| ---- | ------------- | -------- | -------------------- |
| **On** | visible | visible | no restriction keys |
| **User only** | hidden | visible | `disable-model-invocation: true` |
| **Off** | hidden | hidden | `disable-model-invocation: true` + `user-invocable: false` |

- **Settings page**: one row per skill with a three-state segmented control, grouped by source (project / user / custom / bundled) with a search box. Changes take effect immediately — the skill catalog refreshes itself, no restart needed.
- **Composer menu**: a compact **技能 / Skills** control at the left of the composer tool row. Its badge counts the skills that are not fully on (the plain count when everything is on). Clicking it opens a small popover above the button — the same pattern as the permission picker — with search, source groups, one-click undo of the last switch, and a receipt line showing the last write. It closes on outside click or Escape and stays inside the viewport on narrow screens.
- **Kinds of row**: the host publishes an inventory of every skill it can see, including ones hidden with `user-invocable: false` and ones switched off by the tool, so nothing silently disappears from the manager.
- **Skill details**: clicking a skill name opens an information card with its path, source, file size, last-modified time and the full description, warning when the description is long enough to be truncated in the model catalog (500 characters). From there you can open the file in the right sidebar or copy its path.
- **Agent handoff**: the card's *edit* / *archive* buttons and the header's *new* button do not write files. They draft a precise request (absolute path, current switches, archive destination, description budget) into the composer, so the agent performs the change and every write stays auditable.
- **In-app editor (experimental)**: *Edit* opens the SKILL.md in a textarea and *New* opens a creation form. The browser never writes files itself: it publishes a request in the plugin's volatile Configuration, the host performs it (frontmatter validation, 256 KB cap, automatic `.bak` copy, mtime conflict refusal) and publishes the result back. *Archive* moves the skill into `<root>/.archive/<name>-<stamp>/` — there is no hard delete.
- **Tool**: ask the agent in chat ("turn off windows-ops", "list skills"), or call `skill_manager` directly with `list` / `set`. The tool records the same override the UI writes, so both surfaces stay in sync.
- State lives in each skill's own `SKILL.md` frontmatter — the same switches the Harness skill system already honors — so nothing is stored in a database and everything is reversible. Only the derived records (last requested mode, host inventory, last-write receipt) live in the plugin's volatile Configuration.

## Install

```sh
dsh plugin --profile <profile> add @jacksun1994/dsh-skill-switcher
```

Or use **Plugins → Install** in the app with one of these specs:

- npm: `@jacksun1994/dsh-skill-switcher`
- this repository: `https://github.com/yyliucha/dsh-skill-switcher`
- a local checkout directory

Enable the bundle, refresh the page once, and open **Settings → 技能**. The same bundle also adds the **技能** control to the composer tool row.

Requirements: DeepSeek Harness `0.2.2-alpha.3` or newer. From `0.2.2-rc.3` the Client Remote namespaces are separate child services, so this plugin declares `remote.settings` / `remote.skills` in its `inject` list.

## How it works

The manager writes only the two invocation fields of the YAML frontmatter; every other line — including the file's LF/CRLF style — is preserved byte-for-byte.

- The Settings page writes the requested mode into the plugin's own volatile configuration through `remote.settings.update('skill-manager', …)`; the host half listens for `loader/volatile-update` and rewrites the matching file.
- The `skill_manager` tool performs the same file operation directly.
- `skill-filesystem` watches the skill roots, so the catalog picks the change up without a restart.

## Scope and limits

- Only the default skill roots are scanned and writable: `~/.dsh/skills`, `~/.agents/skills`, and the selected session's `.dsh/skills` / `.agents/skills` (symlinked entries are followed).
- Bundled skills (shipped with the DSH installation) are listed but read-only.
- The Settings page needs at least one session: the catalog is read from the selected session's working directory and agent preset.
- A skill disabled by hand (`user-invocable: false` written directly in the file) is filtered out by the catalog itself and won't appear in the page; skills turned off through this manager are remembered in the plugin config and remain restorable.

## Development

```sh
npm install          # pulls @deepseek-ai/schemastery 3.18.6-alpha.2 (pinned, same as DSH)
node --test test/    # 41 unit tests: frontmatter parsing/rewriting, path rules, fixture round-trips
```

Structure:

- `index.js` — host half: configuration, volatile applier, directory scan, `skill_manager` tool
- `client.js` — browser half: Settings → 技能 page (plain React, theme tokens only)
- `lib/skills.js` — dependency-free pure functions (frontmatter edits, root/path rules)
- `test/` — `node:test` suite with committed fixtures
- `locale/` — display metadata and page strings (zh / en / ja / de / es / fr / pt / ru)

---

## 中文

一个 DeepSeek Harness 插件：给 Web 界面加一个 **Settings → 技能** 管理页，并附带 `skill_manager` 工具。列出你的 agent 技能，逐个切换 **全开 / 仅用户 / 已关闭**。

- **设置页**：每个技能一行，右侧三态按钮，按来源分组（项目 / 用户 / 自定义 / 内置）并带搜索框；点完即生效（文件监听自动刷新目录，不用重启）。
- **输入框左侧菜单**：紧凑的「技能」入口，角标显示非「全开」的数量（全开时显示总数）；点一下在按钮上方弹出小菜单（与权限选择器同一形态），内含搜索、来源分组、**撤销上一次切换**、以及"上次写入"回执；点外部或按 Esc 关闭，窄屏也不出界。
- **不会凭空丢失**：宿主会发布一份清单（`inventory`），把会话目录里看不到的也列出来——包括 `user-invocable: false` 手工隐藏的、以及被工具关掉的。
- **技能信息卡**：点技能名打开信息卡——绝对路径、来源、文件大小、最后修改时间、完整描述；描述超过 500 字符会告警（模型目录会截断它）。卡里可一键「打开原文」（右侧栏）或「复制路径」。
- **交给 agent 改**：信息卡里的「让 agent 修改 / 让 agent 归档」和头部的「新建」**不直接写文件**，只把一条精确请求填进输入框（绝对路径、当前开关、归档目标、描述长度要求），由 agent 落盘并校验——写入过程始终可审计。
- **内置编辑器（实验性）**：「编辑」打开 SKILL.md 文本编辑，「新建」打开新建表单。浏览器**从不直接写文件**：它把请求写进插件的 volatile 配置，宿主执行（frontmatter 校验、256 KB 上限、自动 `.bak` 备份、mtime 冲突拒绝）并把结果写回；「归档」是移动到 `<root>/.archive/<名称>-<时间戳>/`，**没有硬删除**。
- **工具**：直接对话操作——「把 windows-ops 关掉」「列出技能状态」；工具写入时会记录与界面同一条 override，两边状态一致。
- 状态直接写进每个 `SKILL.md` 的 frontmatter（就是 DSH 技能系统自己认的那两个字段：`disable-model-invocation` / `user-invocable`），不落数据库、随时可逆、其余内容一字不动（保留 LF/CRLF）；插件自己的配置只存派生数据（最近请求的模式、宿主清单、写入回执）。
**安装**：侧边栏 Plugins → Install，spec 填本地目录 `a local checkout directory` 或本仓库地址 `https://github.com/yyliucha/dsh-skill-switcher`，启用后刷新页面，打开 Settings → 技能。

**范围**：只扫描/改写默认技能根（`~/.dsh/skills`、`~/.agents/skills`、所选会话工作区下的 `.dsh/skills` 与 `.agents/skills`，跟随符号链接）；内置技能只读；页面需要至少一个会话；手工写死 `user-invocable: false` 的孤儿技能不会出现在页面，经管理器关掉的会记住并可改回。

**开发**：`npm install`（固定 schemastery 3.18.6-alpha.2，与 DSH 同版本）+ `node --test test/`（41 个单测，含 fixture 往返）。

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)

