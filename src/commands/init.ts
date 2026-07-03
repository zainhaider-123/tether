import { writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CliArgs } from '../cli.js'

const TEMPLATE = `# tether project config — declares which skills this project uses.
skills = []

[config]
# Optional per-skill overrides, e.g.:
# [config.deepwork]
# auto_phase = true
`

export async function initCommand(_args: CliArgs): Promise<void> {
  const path = resolve(process.cwd(), 'tether.toml')
  if (existsSync(path)) {
    console.log(`✗ tether.toml already exists at ${path}`)
    return
  }
  writeFileSync(path, TEMPLATE, 'utf8')
  console.log(`✓ Created ./tether.toml`)
}