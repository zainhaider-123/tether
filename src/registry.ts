import { cpSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { ensureStore, skillStorePath, skillIsInstalled, removeSkill, writeMetadata } from './store.js'
import { loadGlobalConfig } from './config.js'
import type { SkillMetadata, SkillSource, SkillSourceKind } from './skill.js'

export interface InstallResult {
  name: string
  source: SkillSourceKind
  origin: string
}

export function resolveSource(
  name: string,
  explicitSrc?: string,
): { kind: SkillSourceKind; origin: string; url?: string; path?: string; version?: string } {
  if (explicitSrc) {
    if (existsSync(resolvePath(explicitSrc))) {
      return { kind: 'local', origin: explicitSrc, path: explicitSrc }
    }
    if (/^https?:\/\//.test(explicitSrc) || /^git@/.test(explicitSrc)) {
      return { kind: 'git', origin: explicitSrc, url: explicitSrc }
    }
    if (explicitSrc.startsWith('gh:')) {
      const url = `https://github.com/${explicitSrc.slice(3)}`
      return { kind: 'git', origin: explicitSrc, url }
    }
    return { kind: 'registry', origin: explicitSrc, version: explicitSrc }
  }

  const global = loadGlobalConfig()
  const src = global.skills?.[name]
  if (src) {
    switch (src.source) {
      case 'local':
        return { kind: 'local', origin: src.path ?? '', path: src.path }
      case 'git':
        return { kind: 'git', origin: src.url ?? '', url: src.url }
      case 'registry':
        return { kind: 'registry', origin: `registry:${name}`, version: src.version }
    }
  }

  const defaultSource = global.registry?.default_source
  if (defaultSource?.startsWith('gh:')) {
    const url = `https://github.com/${defaultSource.slice(3)}/${name}`
    return { kind: 'git', origin: url, url }
  }

  throw new Error(`Could not resolve source for skill "${name}". Define it in config.toml or pass a source.`)
}

export function installSkill(name: string, explicitSrc?: string): InstallResult {
  ensureStore()
  const resolved = resolveSource(name, explicitSrc)

  if (skillIsInstalled(name)) {
    removeSkill(name)
  }

  const dest = skillStorePath(name)

  switch (resolved.kind) {
    case 'local': {
      const src = resolvePath(resolved.path ?? '')
      if (!existsSync(src)) throw new Error(`Local source path does not exist: ${src}`)
      cpSync(src, dest, { recursive: true })
      break
    }
    case 'git': {
      if (!resolved.url) throw new Error('Git source missing URL')
      execSync(`git clone --depth 1 ${resolved.url} "${dest}"`, { stdio: 'pipe' })
      break
    }
    case 'registry': {
      throw new Error('Registry install not implemented in v1. Use local or git source.')
    }
  }

  const meta: SkillMetadata = {
    name,
    version: resolved.version ?? '1.0.0',
    source: resolved.kind,
    installedAt: new Date().toISOString(),
    origin: resolved.origin,
  }
  writeMetadata(name, meta)

  return { name, source: resolved.kind, origin: resolved.origin }
}