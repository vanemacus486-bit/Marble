import { ipcMain, dialog } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { VaultManager } from '../services/vault-manager'
import type { ConfigManager } from '../services/config-manager'

export function registerVaultIpc(vaultManager: VaultManager, configManager: ConfigManager): void {
  ipcMain.handle(IPC_CHANNELS.VAULT_OPEN_DIALOG, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Vault Folder',
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_LIST_FILES, async (_event, dir?: string) => {
    return vaultManager.listFiles(dir)
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_GET_CONFIG, async () => {
    return configManager.loadVaultConfig()
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_SET_CONFIG, async (_event, config) => {
    const current = await configManager.loadVaultConfig()
    const merged = { ...current, ...config }
    await configManager.saveVaultConfig(merged)
  })

  ipcMain.handle(IPC_CHANNELS.VAULT_RESOLVE_PATH, async (_event, relativePath: string) => {
    return vaultManager.resolvePath(relativePath)
  })
}
