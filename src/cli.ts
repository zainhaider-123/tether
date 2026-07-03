import { initCommand } from './commands/init.js'
import { installCommand } from './commands/install.js'
import { uninstallCommand } from './commands/uninstall.js'
import { listCommand } from './commands/list.js'
import { useCommand } from './commands/use.js'
import { runTui } from './tui/App.js'

export enum Command {
  Help = 'help',
  Version = 'version',
  Init = 'init',
  Install = 'install',
  Uninstall = 'uninstall',
  List = 'list',
  Use = 'use',
  Tui = 'tui',
}

export interface CliArgs {
  command: Command
  tui: boolean
  positional: string[]
  flags: Record<string, string>
}

const KNOWN_COMMANDS = new Set<string>([
  'init',
  'install',
  'uninstall',
  'list',
  'use',
])

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: Command.Help,
    tui: false,
    positional: [],
    flags: {},
  }

  if (argv.length === 0) return args

  let i = 0
  if (argv[0] === '--tui') {
    args.tui = true
    i = 1
  }

  if (argv[i] === '--help' || argv[i] === '-h') {
    args.command = Command.Help
    return args
  }
  if (argv[i] === '--version' || argv[i] === '-v') {
    args.command = Command.Version
    return args
  }

  const cmd = argv[i]
  i++

  if (args.tui && (cmd === undefined || !KNOWN_COMMANDS.has(cmd))) {
    args.command = Command.Tui
    return args
  }

  switch (cmd) {
    case 'init':
      args.command = Command.Init
      break
    case 'install':
      args.command = Command.Install
      break
    case 'uninstall':
      args.command = Command.Uninstall
      break
    case 'list':
      args.command = Command.List
      break
    case 'use':
      args.command = Command.Use
      break
    default:
      args.command = Command.Help
      return args
  }

  for (; i < argv.length; i++) {
    const tok = argv[i]
    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=')
      if (eq > -1) {
        args.flags[tok.slice(2, eq)] = tok.slice(eq + 1)
      } else {
        const key = tok.slice(2)
        if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
          args.flags[key] = argv[i + 1]
          i++
        } else {
          args.flags[key] = 'true'
        }
      }
    } else {
      args.positional.push(tok)
    }
  }

  return args
}

export async function dispatch(args: CliArgs): Promise<void> {
  if (args.command === Command.Help) {
    printHelp()
    return
  }
  if (args.command === Command.Version) {
    console.log('tether v1.0.0')
    return
  }
  if (args.command === Command.Tui || args.tui) {
    await runTui()
    return
  }
  switch (args.command) {
    case Command.Init:
      await initCommand(args)
      break
    case Command.Install:
      await installCommand(args)
      break
    case Command.Uninstall:
      await uninstallCommand(args)
      break
    case Command.List:
      await listCommand(args)
      break
    case Command.Use:
      await useCommand(args)
      break
  }
}

function printHelp(): void {
  console.log(`
tether — skill manager CLI/TUI

Usage:
  tether <command> [options]
  tether --tui

Commands:
  init                    Create a ./tether.toml in current directory
  install <skill> [src]   Install a skill into the store
  uninstall <skill>       Remove a skill from the store
  list                    List installed skills
  use [--format <fmt>]    Resolve skills from tether.toml and output their context

Options:
  --tui                   Launches the interactive TUI (default if no subcommand)
  --help, -h              Show this help
  --version, -v           Show version

Formats for 'use':
  universal (default)     Concatenated SKILL.md content
  opencode                AGENTS.md formatted available_skills entries
  json                    JSON with paths + content
`)
}