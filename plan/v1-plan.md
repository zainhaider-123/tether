# tether v1 — Skill Manager CLI + TUI

## Vision

A language-agnostic CLI/TUI tool that manages skills like a package manager. Skills are installed into tether's own store and made available to any AI agent (OpenCode, Claude Code, Cursor, etc.) via the `use` command.

---

## Architecture

### Config Scopes

| Scope | Path | Purpose |
|---|---|---|
| Global | `~/.config/tether/config.toml` | Skill source definitions, default config |
| Project | `./tether.toml` | Which skills this project uses |

### Skill Store

All installed skills live in `~/.config/tether/store/<name>/`. Each skill directory contains:

```
store/deepwork/
├── SKILL.md        # Main instructions (required)
├── assets/         # Supporting files (optional)
└── metadata.toml   # Installation metadata (generated)
```

---

## Interaction Modes

### CLI Mode (default)

Standard `command <arg>` style for scripting and quick use:

```
tether install deepwork
tether list
tether use
```

### TUI Mode (`--tui` flag)

Interactive terminal UI built with OpenTUI (`@opentui/react`):

```
tether --tui
```

Opens a full-screen TUI with:
- **Dashboard** — list of installed skills, status
- **Install** — search/browse/install skills interactively
- **Project config** — toggle which skills are active
- **Preview** — view SKILL.md content before using

---

## TOML Schemas

### Global Config (`~/.config/tether/config.toml`)

```toml
[registry]
default_source = "gh:opencode-skills"

[skills.deepwork]
source = "local"
path = "~/.config/opencode/skills/deepwork"

[skills.codemap]
source = "git"
url = "https://github.com/example/codemap-skill"

[skills.simplify]
source = "registry"
version = "1.0.0"
```

### Project Config (`./tether.toml`)

```toml
skills = ["deepwork", "codemap", "simplify"]

[config]
# Optional per-skill overrides
[config.deepwork]
auto_phase = true
```

---

## CLI Commands

### `tether init`

Creates a `tether.toml` in the current directory with a template.

```
$ tether init
✓ Created ./tether.toml
```

### `tether install <skill> [source]`

Installs a skill into `~/.config/tether/store/`.

| Source | Behavior |
|---|---|
| `local` (via config.toml source) | Copies from the configured path |
| `git` (via config.toml source) | Clones the repo (shallow) |
| Direct path | `tether install deepwork ~/.config/opencode/skills/deepwork` |
| Registry name | `tether install deepwork` (looks up in registry) |

```
$ tether install deepwork
✓ Installed deepwork → ~/.config/tether/store/deepwork/
```

### `tether uninstall <skill>`

Removes a skill from the store.

```
$ tether uninstall deepwork
✓ Removed deepwork
```

### `tether list`

Lists installed skills with metadata.

```
$ tether list
deepwork  v1.0.0  ~/.config/tether/store/deepwork/
codemap   v0.2.0  git:github.com/example/codemap
simplify  v1.1.0  local:~/.config/opencode/skills/simplify
```

### `tether use [--format <format>]`

Resolves skills from `tether.toml` and outputs their context.

```
$ tether use

# => Outputs concatenated SKILL.md content from all resolved skills
```

Formats:
| Format | Output | Use case |
|---|---|---|
| `universal` (default) | Raw concatenated SKILL.md content | Pipe into any agent |
| `opencode` | AGENTS.md-formatted `available_skills` entries | OpenCode |
| `json` | JSON with paths + content | Programmatic use |

### `tether [--tui]`

Launches the interactive TUI (default if no subcommand given with `--tui`).

---

## Data Flow

```
tether use
  ├── Read ./tether.toml → ["deepwork", "codemap"]
  ├── Read ~/.config/tether/config.toml → resolves sources
  ├── For each skill:
  │   ├── Verify in ~/.config/tether/store/<name>/
  │   └── Read SKILL.md
  ├── Merge contexts
  └── Output (formatted)
```

```
tether install deepwork
  ├── Resolve source (config.toml or CLI arg)
  ├── If local:  cp -r <path> ~/.config/tether/store/deepwork/
  ├── If git:    git clone --depth 1 <url> ~/.config/tether/store/deepwork/
  ├── If registry: download from registry URL
  ├── Write metadata.toml
  └── Confirm
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| CLI arg parsing | Manual `process.argv` (lightweight, no framework) |
| TUI framework | `@opentui/react` (React reconciler for terminal) |
| React runtime | `react`, `react-reconciler` |
| TOML parsing | `smol-toml` |
| Config merging | Custom deep merge (no deps) |
| Distribution | `npm publish` / `npm install -g` |

---

## Project Structure

```
tether/
├── package.json
├── tsconfig.json
├── .gitignore
├── bin/
│   └── tether.js              # #!/usr/bin/env node
├── src/
│   ├── index.ts               # Entry: CLI or TUI dispatch
│   ├── cli.ts                 # process.argv parsing, command dispatch
│   ├── config.ts              # TOML load/merge (global + project)
│   ├── store.ts               # Store path resolution, metadata
│   ├── skill.ts               # Skill model type, resolution logic
│   ├── registry.ts            # Install sources (local, git, registry)
│   ├── commands/
│   │   ├── init.ts
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   ├── list.ts
│   │   └── use.ts
│   └── tui/
│       ├── App.tsx             # Root React component
│       ├── Dashboard.tsx       # Main dashboard screen
│       ├── Installer.tsx       # Install/browse screen
│       └── ProjectConfig.tsx   # Toggle active skills
```

---

## Implementation Phases

| Phase | Scope | Deliverable |
|---|---|---|
| **1. Scaffold** | package.json, tsconfig, bin entry, arg parsing | `tether --help` works |
| **2. Config** | TOML parsing, global+project load, merge | `config.ts` with load/merge |
| **3. Store** | Path resolution, read/write metadata | `store.ts` with store CRUD |
| **4. Init** | `tether init` creates tether.toml | Template generation |
| **5. List** | `tether list` shows installed skills | Store enumeration |
| **6. Install** | `tether install` from local/git | Skills in store |
| **7. Use** | `tether use` resolves + outputs context | Core value prop |
| **8. TUI** | OpenTUI app with dashboard, installer, config | `tether --tui` |
| **9. Uninstall** | `tether uninstall` removes from store | Cleanup |
| **10. Polish** | Error handling, edge cases, README | v1 release |

---

## Future (post-v1)

- `tether use --format=claude` — Claude Code format
- Registry server for skill discovery
- Skill versioning / updates (`tether update`)
- Auto-activation hooks (shell plugin, direnv)
- Skill dependencies (`requires` field in SKILL.md)
