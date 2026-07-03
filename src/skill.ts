export type SkillSourceKind = 'local' | 'git' | 'registry'

export interface SkillSource {
  source: SkillSourceKind
  path?: string
  url?: string
  version?: string
}

export interface SkillMetadata {
  name: string
  version: string
  source: SkillSourceKind
  installedAt: string
  origin?: string
}

export interface ResolvedSkill {
  name: string
  metadata: SkillMetadata
  skillMdPath: string
  skillMdContent: string
  storePath: string
}