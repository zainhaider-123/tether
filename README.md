# tether

A language-agnostic CLI/TUI tool that manages skills like a package manager. Skills are installed into tether's own store and wired into any AI agent (OpenCode, Claude Code, Cursor, etc.).

## Features

- **Install skills** from local paths, git repos, or a registry
- **Wire skills** into agent directories (`.opencode/skills/`, `.claude/skills/`) via symlinks
- **Resolve context** — output `SKILL.md` content in universal, opencode, or JSON format
- **Project config** — declare which skills a project uses in `tether.toml`
- **TUI mode** — interactive terminal UI (`tether --tui`)

## Install

```bash
git clone https://github.com/zainhaider-123/tether.git
cd tether
npm install
npm install -g .
```

Requires Node.js 20+.

## Quick Start

```bash
# Create a project config
tether init

# Install a skill from a local path
tether install deepwork ~/.config/opencode/skills/deepwork

# Install from a git repo
tether install codemap https://github.com/example/codemap-skill

# List installed skills
tether list

# Wire skills into .opencode/skills/ and output context
tether use

# Output in opencode AGENTS.md format
tether use --format=opencode

# Interactive TUI
tether --tui
```

## Commands

| Command                        | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| `init`                         | Create `./tether.toml` in the current directory                      |
| `install <skill> [source]`     | Install a skill into `~/.config/tether/store/`                       |
| `uninstall <skill>`            | Remove a skill from the store                                        |
| `list`                         | List installed skills with metadata                                  |
| `use [skill] [--format <fmt>]` | Resolve skills from `tether.toml`, wire symlinks, and output context |

### `tether use` formats

| Format                | Output                                           |
| --------------------- | ------------------------------------------------ |
| `universal` (default) | Concatenated `SKILL.md` content                  |
| `opencode`            | AGENTS.md-formatted `<available_skills>` entries |
| `json`                | JSON with paths, metadata, and content           |

### Install sources

| Source           | Example                                                      |
| ---------------- | ------------------------------------------------------------ |
| Local path       | `tether install deepwork ~/.config/opencode/skills/deepwork` |
| Git URL          | `tether install codemap https://github.com/example/codemap`  |
| GitHub shorthand | `tether install codemap gh:example/codemap`                  |
| Config-defined   | `tether install deepwork` (resolved from `config.toml`)      |

## Configuration

### Global config (`~/.config/tether/config.toml`)

Defines skill sources and defaults:

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

### Project config (`./tether.toml`)

Declares which skills the project uses:

```toml
skills = ["deepwork", "codemap", "simplify"]

[config]
[config.deepwork]
auto_phase = true
```

## Store

Installed skills live in `~/.config/tether/store/<name>/`:

```
store/deepwork/
├── SKILL.md
├── assets/
└── metadata.toml
```

Override the config directory with `TETHER_CONFIG_HOME`.

## How it works

```
tether use → reads ./tether.toml → resolves skills from store
           → creates symlinks in .opencode/skills/ (and .claude/skills/)
           → outputs SKILL.md content
```

```
tether install deepwork → resolves source → copies/clones to store
                        → writes metadata.toml
```

## Project Structure

```
tether/
├── bin/tether.js        # CLI entry point
├── src/
│   ├── index.ts          # Main entry
│   ├── cli.ts            # Arg parsing & dispatch
│   ├── config.ts         # TOML config load/merge
│   ├── store.ts          # Store path resolution & CRUD
│   ├── skill.ts          # Skill types
│   ├── registry.ts       # Install sources
│   ├── commands/         # Command implementations
│   └── tui/              # TUI (terminal UI)
├── tether.toml           # Project skill declarations
└── package.json
```

## License

MIT
