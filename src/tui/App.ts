import { listInstalledSkills, readMetadata, skillStorePath } from '../store.js'
import { loadProjectConfig } from '../config.js'

export async function runTui(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║          tether — Skill Manager            ║')
  console.log('╚══════════════════════════════════════════╝\n')

  const installed = listInstalledSkills()
  console.log(`Installed skills: ${installed.length}`)
  for (const name of installed) {
    const meta = readMetadata(name)
    if (meta) {
      console.log(`  • ${name}  v${meta.version}  [${meta.source}]  ${skillStorePath(name)}`)
    } else {
      console.log(`  • ${name}  (no metadata)`)
    }
  }
  console.log('')

  const project = loadProjectConfig()
  if (project) {
    console.log(`Project skills (tether.toml): ${project.skills.join(', ') || '(none)'}`)
  } else {
    console.log('No tether.toml in current directory. Run `tether init`.')
  }
  console.log('\n(Full interactive TUI coming in a later phase — this is a summary view.)\n')
}