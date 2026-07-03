import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import * as TOML from 'smol-toml'
import type { SkillSource } from './skill.js'

export interface GlobalConfig {
  registry?: {
    default_source?: string
  }
  skills?: Record<string, SkillSource>
}

export interface ProjectConfig {
  skills: string[]
  config?: Record<string, Record<string, unknown>>
}

let _globalPathMemo: string | null = null

export function globalConfigPath(): string {
  if (_globalPathMemo) return _globalPathMemo
  const home = process.env['TETHER_CONFIG_HOME'] ?? join(homedir(), '.config', 'tether')
  _globalPathMemo = join(home, 'config.toml')
  return _globalPathMemo
}

export function globalConfigDir(): string {
  const p = globalConfigPath()
  return p.substring(0, p.length - '/config.toml'.length)
}

export function projectConfigPath(): string {
  return resolve(process.cwd(), 'tether.toml')
}

export function emptyGlobalConfig(): GlobalConfig {
  return {}
}

export function defaultProjectConfig(): ProjectConfig {
  return { skills: [] }
}

export function loadGlobalConfig(): GlobalConfig {
  const path = globalConfigPath()
  if (!existsSync(path)) return {}
  const text = readFileSync(path, 'utf8')
  const parsed = TOML.parse(text) as unknown as GlobalConfig
  return parsed ?? {}
}

export function loadProjectConfig(): ProjectConfig | null {
  const path = projectConfigPath()
  if (!existsSync(path)) return null
  const text = readFileSync(path, 'utf8')
  const parsed = TOML.parse(text) as unknown as ProjectConfig
  if (!Array.isArray(parsed.skills)) parsed.skills = []
  return parsed
}

export function mergeConfig(
  global: GlobalConfig,
  project: ProjectConfig | null,
): { skills: string[]; sources: Record<string, SkillSource>; defaultSource?: string } {
  const sources = { ...(global.skills ?? {}) }
  const skills = project ? [...project.skills] : []
  const defaultSource = global.registry?.default_source
  return { skills, sources, defaultSource }
}