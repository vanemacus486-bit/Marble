import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { ExportService } from '../services/export-service'

export function registerExportIpc(exportService: ExportService): void {
  ipcMain.handle(IPC_CHANNELS.EXPORT_PLAINTEXT, async (_event, html: string) => {
    return exportService.plaintext(html)
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT_MARKDOWN, async (_event, html: string) => {
    return exportService.markdown(html)
  })
}
