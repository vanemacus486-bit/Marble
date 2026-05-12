import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve } from 'path'
import { z } from 'zod'
import { defaultVaultConfig } from '../types/ipc-contracts'
import type { VaultConfig } from '../types/ipc-contracts'

const vaultConfigSchema = z.object({
  vaultVersion: z.number().int().min(1).default(1),
  theme: z.string().default('system'),
  themeSource: z.enum(['system', 'light', 'dark']).default('system'),
  customCss: z.array(z.string()).default([]),
  editor: z.object({
    fontSize: z.number().min(8).max(72).default(16),
    fontFamily: z.string().default('system-ui, -apple-system, sans-serif'),
    lineHeight: z.number().min(1).max(3).default(1.6),
    tabSize: z.number().int().min(1).max(8).default(2),
    spellcheck: z.boolean().default(true),
    autoPairBrackets: z.boolean().default(true),
    enableWysiwyg: z.boolean().default(false),
    defaultEditMode: z.enum(['source', 'wysiwyg', 'read']).default('source'),
  }).default({}),
  graph: z.object({
    showArrows: z.boolean().default(true),
    physicsEnabled: z.boolean().default(true),
    nodeSizeBy: z.enum(['links', 'wordCount', 'none']).default('links'),
    filterFolders: z.array(z.string()).default([]),
    filterTags: z.array(z.string()).default([]),
    maxNodes: z.number().int().min(1).default(5000),
  }).default({}),
  search: z.object({
    includeTags: z.boolean().default(true),
    includeContent: z.boolean().default(true),
    fuzzyThreshold: z.number().min(0).max(1).default(0.4),
  }).default({}),
  features: z.object({
    dailyNotes: z.boolean().default(false),
    dailyNotesFolder: z.string().default('Daily'),
    dailyNotesTemplate: z.string().default(''),
    autoSaveInterval: z.number().int().min(500).default(2000),
  }).default({}),
  system: z.object({
    excludeFolders: z.array(z.string()).default(['.git', 'node_modules', '.marble']),
    fileWatcher: z.boolean().default(true),
  }).default({}),
})

const CONFIG_FILENAME = 'config.json'
const MARBLE_DIR = '.marble'

export class ConfigManager {
  private vaultRoot: string
  private configDir: string
  private configPath: string

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot
    this.configDir = resolve(vaultRoot, MARBLE_DIR)
    this.configPath = resolve(this.configDir, CONFIG_FILENAME)
  }

  async loadVaultConfig(): Promise<VaultConfig> {
    try {
      const raw = await readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw)
      const result = vaultConfigSchema.safeParse(parsed)
      if (result.success) {
        return result.data as VaultConfig
      }
      return defaultVaultConfig()
    } catch {
      return defaultVaultConfig()
    }
  }

  async saveVaultConfig(config: VaultConfig): Promise<void> {
    await this.ensureVaultDir()
    const validated = vaultConfigSchema.parse(config)
    await writeFile(
      this.configPath,
      JSON.stringify(validated, null, 2),
      'utf-8'
    )
  }

  async ensureVaultDir(): Promise<void> {
    await mkdir(this.configDir, { recursive: true })
  }
}
