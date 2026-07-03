import type { CliArgs } from '../cli.js'
import { installSkill } from '../registry.js'
import { skillIsInstalled } from '../store.js'

export async function installCommand(args: CliArgs): Promise<void> {
  const name = args.positional[0]
  if (!name) {
    console.error('Usage: tether install <skill> [source]')
    process.exitCode = 1
    return
  }
  const explicitSrc = args.positional[1]

  try {
    const result = installSkill(name, explicitSrc)
    const wasInstalled = skillIsInstalled(name)
    const prefix = wasInstalled ? '✓ Reinstalled' : '✓ Installed'
    console.log(`${prefix} ${result.name} → ${result.origin} (${result.source})`)
  } catch (err) {
    console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  }
}