import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { FileWatcher } from '../services/file-watcher'
import type { FileChangeEvent } from '../types/ipc-contracts'

const subscribedWindows = new Set<number>()

export function registerFileWatcherIpc(fileWatcher: FileWatcher): void {
  fileWatcher.onChange((events: FileChangeEvent[]) => {
    for (const windowId of subscribedWindows) {
      const win = require('electron').BrowserWindow.fromId(windowId)
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.FW_FILE_CHANGED, events)
      }
    }
  })

  ipcMain.on(IPC_CHANNELS.FW_SUBSCRIBE, (event) => {
    subscribedWindows.add(event.sender.id)
  })

  ipcMain.on(IPC_CHANNELS.FW_UNSUBSCRIBE, (event) => {
    subscribedWindows.delete(event.sender.id)
  })
}
