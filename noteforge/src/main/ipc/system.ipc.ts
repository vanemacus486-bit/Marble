import { ipcMain, app, shell } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { AppConfig } from '../types/ipc-contracts'
import { defaultAppConfig } from '../types/ipc-contracts'
import Store from 'electron-store'

const appStore = new Store<{ app: AppConfig }>({
  defaults: { app: defaultAppConfig() },
})

export function registerSystemIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_VERSION, () => app.getVersion())

  ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_IN_FOLDER, (_event, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_APP_CONFIG, () => {
    return appStore.get('app', defaultAppConfig())
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SET_APP_CONFIG, (_event, config: Partial<AppConfig>) => {
    const current = appStore.get('app', defaultAppConfig())
    appStore.set('app', { ...current, ...config })
  })
}
