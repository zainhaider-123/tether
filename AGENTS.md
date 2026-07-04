# tether — skill manager CLI/TUI

## Quick start

```bash
npm install          # single dep: smol-toml
npm run build        # tsc + copies bin/tether.js → dist/
npm run dev          # build + reinstall global
npm start            # node bin/tether.js
npm run typecheck    # tsc --noEmit (same as lint)
npm run lint         # same as typecheck
```

No test framework — none is configurd.

## Important

- **No `tether.toml` exists in this repo.** If you need one (e.g. to test `use`), create it manually or run `node bin/tether.js init`.
- **No CI workflow** exists.
- **No formatter** (no prettier, eslint, biome, dprint).
- **Lint === typecheck** (`tsc --noEmit`). Both npm scripts do the same thing.
- **TUI is a summary view only** — the full React TUI (`@opentui/react`) from the plan is NOT yet implemented.
- **Arg parsing is hand-rolled** (`cli.ts`), no framework.

## How it works

```
bin/tether.js  →  dist/index.js (tsc output of src/)
                →  main() in src/index.ts
                →  parseArgs / dispatch in src/cli.ts
```

Config is merged from two scopes:
| Scope | Path | Contents |
|-------|------|---------|
| Global | `~/.config/tether/config.toml` (override via `TETHER_CONFIG_HOME`) | Source definitions per skill |
| Project | `./tether.toml` (cwd) | Which skills this project uses |

Installed skills live in `~/.config/tether/store/<name>/` (or `$TETHER_CONFIG_HOME/store/<name>/`).

## Commands

| Command | Behavior |
|---------|----------|
| `init` | Creates `./tether.toml` from hardcoded template |
| `install <name> [source]` | Copies local path / shallow-clones git / (registry not implemented) |
| `uninstall <name>` | Removes from store |
| `list` | Lists store contents with metadata |
| `use [name] [--format=<fmt>]` | Resolves `tether.toml`, wires symlinks into `.opencode/skills/` (also `.claude`, `.agents`), outputs SKILL.md content |

Source resolution order: explicit CLI arg → `config.toml` `[skills.<name>]` → `registry.default_source`.

Git install shallow-clones then searches for `SKILL.md` in: root → `skills/<name>` → `skills/<name>-skill` → first subdir with `SKILL.md`.

`tether use <name>` auto-adds the skill to `tether.toml`.

## Key source layout

```
src/
├── index.ts          # main()
├── cli.ts            # parseArgs + dispatch
├── config.ts         # TOML load/merge (global + project)
├── store.ts          # ~/.config/tether/store/ CRUD
├── skill.ts          # types
├── registry.ts       # install from local/git/registry
├── commands/         # init, install, uninstall, list, use
└── tui/App.ts        # non-interactive summary (not full React TUI)
```

## Build quirk

`tsc` compiles `src/` to `dist/`. But `bin/tether.js` lives outside `src/`, so `build:copy` copies it into `dist/` after tsc. The `bin` field in `package.json` always points to `bin/tether.js` (source), which imports from `../dist/index.js` (compiled).
