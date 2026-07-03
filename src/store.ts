import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as TOML from 'smol-toml'
import type { SkillMetadata } from './skill.js'

let _storeDirMemo: string | null = null

export function storeDir(): string {
  if (_storeDirMemo) return _storeDirMemo
  const home = process.env['TETHER_CONFIG_HOME'] ?? join(homedir(), '.config', 'tether')
  _storeDirMemo = join(home, 'store')
  return _storeDirMemo
}

export function skillStorePath(name: string): string {
  return join(storeDir(), name)
}

export function ensureStore(): void {
  mkdirSync(storeDir(), { recursive: true })
}

export function skillIsInstalled(name: string): boolean {
  return existsSync(join(skillStorePath(name), 'SKILL.md'))
}

export function writeMetadata(name: string, meta: SkillMetadata): void {
  const dir = skillStorePath(name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'metadata.toml'), TOML.stringify(meta as unknown as Record<string, unknown>))
}

export function readMetadata(name: string): SkillMetadata | null {
  const p = join(skillStorePath(name), 'metadata.toml')
  if (!existsSync(p)) return null
  const text = readFileSync(p, 'utf8')
  return TOML.parse(text) as unknown as SkillMetadata
}

export function removeSkill(name: string): void {
  rmSync(skillStorePath(name), { recursive: true, force: true })
}

export function listInstalledSkills(): string[] {
  if (!existsSync(storeDir())) return []
  return readdirSync(storeDir(), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

export function readSkillMd(name: string): string | null {
  const p = join(skillStorePath(name), 'SKILL.md')
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}