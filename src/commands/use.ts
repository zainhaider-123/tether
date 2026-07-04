import { existsSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync, lstatSync } from 'node:fs'
import { resolve, join } from 'node:path'
import type { CliArgs } from '../cli.js'
import { addSkillToProjectConfig, loadProjectConfig } from '../config.js'
import { readMetadata, readSkillMd, skillIsInstalled, skillStorePath } from '../store.js'
import type { ResolvedSkill } from '../skill.js'

const AGENT_DIRS = ['.opencode', '.claude', '.agents']

function wireSkills(skills: string[], verbose = true): void {
  const scanDirs = ['.opencode', '.claude', '.agents']
  const found: string[] = []
  for (const d of scanDirs) {
    if (existsSync(resolve(process.cwd(), d, 'skills'))) found.push(d)
  }
  if (found.length === 0) found.push('.opencode')

  for (const dir of found) {
    const skillsDir = resolve(process.cwd(), dir, 'skills')
    if (!existsSync(skillsDir)) mkdirSync(skillsDir, { recursive: true })
    const existing = new Set(
      readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isSymbolicLink() || d.isDirectory())
        .map((d) => d.name),
    )
    for (const name of skills) {
      const linkPath = join(skillsDir, name)
      const target = skillStorePath(name)
      if (existing.has(name) || existsSync(linkPath)) {
        if (lstatSync(linkPath).isSymbolicLink() && readlinkSync(linkPath) === target) continue
        rmSync(linkPath, { recursive: true, force: true })
      }
      symlinkSync(target, linkPath)
      if (verbose) console.error(`  ${dir}/skills/${name} → ${target}`)
    }
    if (verbose) console.error(`✓ Wired skills into ${dir}/`)
  }
}

export async function useCommand(args: CliArgs): Promise<void> {
  const format = args.flags['format'] ?? 'universal'
  const skillArg = args.positional[0]

  let project = loadProjectConfig()
  if (!project) {
    console.error('✗ No tether.toml found in current directory. Run `tether init` first.')
    process.exitCode = 1
    return
  }

  if (skillArg) {
    if (!skillIsInstalled(skillArg)) {
      console.error(`✗ ${skillArg} is not installed. Run \`tether install ${skillArg}\` first.`)
      process.exitCode = 1
      return
    }
    const added = addSkillToProjectConfig(skillArg)
    if (added) console.error(`✓ Added ${skillArg} to ./tether.toml`)
    project = loadProjectConfig()
    if (!project) {
      console.error('✗ Failed to reload ./tether.toml')
      process.exitCode = 1
      return
    }
  }

  const declared = project!.skills
  if (declared.length === 0) {
    console.error('✗ No skills declared in ./tether.toml')
    process.exitCode = 1
    return
  }

  const resolved: ResolvedSkill[] = []
  const missing: string[] = []
  for (const name of declared) {
    if (!skillIsInstalled(name)) {
      missing.push(name)
      continue
    }
    const meta = readMetadata(name)
    const content = readSkillMd(name) ?? ''
    resolved.push({
      name,
      metadata: meta ?? {
        name,
        version: '0.0.0',
        source: 'local',
        installedAt: '',
      },
      skillMdPath: `${skillStorePath(name)}/SKILL.md`,
      skillMdContent: content,
      storePath: skillStorePath(name),
    })
  }

  if (missing.length > 0) {
    console.error(`✗ Not installed: ${missing.join(', ')}  (run \`tether install <name>\`)`)
    process.exitCode = 1
    return
  }

  // Wire symlinks so agents discover skills natively
  console.error('Wiring skills into project...')
  wireSkills(declared)

  switch (format) {
    case 'universal':
      console.log(resolved.map((r) => r.skillMdContent).join('\n\n---\n\n'))
      break
    case 'opencode':
      console.log(renderOpencode(resolved))
      break
    case 'json':
      console.log(
        JSON.stringify(
          resolved.map((r) => ({
            name: r.name,
            path: r.skillMdPath,
            storePath: r.storePath,
            metadata: r.metadata,
            content: r.skillMdContent,
          })),
          null,
          2,
        ),
      )
      break
    default:
      console.error(`✗ Unknown format: ${format}`)
      process.exitCode = 1
  }
}

function renderOpencode(skills: ResolvedSkill[]): string {
  const lines: string[] = ['# Available Skills', '']
  lines.push('Skills provide specialized instructions and workflows for specific tasks.')
  lines.push('Use the skill tool to load a skill when the task matches its description.')
  lines.push('')
  lines.push('<available_skills>')
  for (const s of skills) {
    const desc = extractDescription(s.skillMdContent)
    lines.push('  <skill>')
    lines.push(`    <name>${s.name}</name>`)
    lines.push(`    <description>${desc}</description>`)
    lines.push(`    <location>${s.skillMdPath}</location>`)
    lines.push('  </skill>')
  }
  lines.push('</available_skills>')
  return lines.join('\n')
}

function extractDescription(content: string): string {
  const match = content.match(/^(?:#\s*)?([^\n]+)/)
  return match ? match[1].replace(/^#\s*/, '').trim() : ''
}