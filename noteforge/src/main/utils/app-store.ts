import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { defaultAppConfig } from '../types/ipc-contracts'
import type { AppConfig } from '../types/ipc-contracts'

export interface AppStoreSchema {
  app: AppConfig
}

const STORE_FILENAME = 'app-config.json'

function storePath(): string {
  return join(app.getPath('userData'), STORE_FILENAME)
}

async function ensureDir(): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
}

export async function loadAppStore(): Promise<AppStoreSchema> {
  try {
    const raw = await readFile(storePath(), 'utf-8')
    return JSON.parse(raw) as AppStoreSchema
  } catch {
    return { app: defaultAppConfig() }
  }
}

export async function saveAppStore(data: AppStoreSchema): Promise<void> {
  await ensureDir()
  await writeFile(storePath(), JSON.stringify(data, null, 2), 'utf-8')
}
