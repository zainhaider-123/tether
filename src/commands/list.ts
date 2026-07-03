import type { CliArgs } from '../cli.js'
import { listInstalledSkills, readMetadata, skillStorePath } from '../store.js'

export async function listCommand(_args: CliArgs): Promise<void> {
  const names = listInstalledSkills()
  if (names.length === 0) {
    console.log('No skills installed.')
    return
  }
  const rows = names.map((name) => {
    const meta = readMetadata(name)
    if (!meta) {
      return `${name.padEnd(12)} (no metadata)  ${skillStorePath(name)}`
    }
    const ver = `v${meta.version}`.padEnd(10)
    const src = meta.source.padEnd(8)
    return `${name.padEnd(12)} ${ver} ${src} ${meta.origin ?? ''}`
  })
  console.log(rows.join('\n'))
}