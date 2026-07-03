import type { CliArgs } from '../cli.js'
import { removeSkill, skillIsInstalled } from '../store.js'

export async function uninstallCommand(args: CliArgs): Promise<void> {
  const name = args.positional[0]
  if (!name) {
    console.error('Usage: tether uninstall <skill>')
    process.exitCode = 1
    return
  }
  if (!skillIsInstalled(name)) {
    console.log(`✗ ${name} is not installed`)
    return
  }
  removeSkill(name)
  console.log(`✓ Removed ${name}`)
}