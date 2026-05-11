import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import type { VaultManager } from '../services/vault-manager'
import type { NoteParser } from '../services/note-parser'
import type { TemplateService } from '../utils/template-service'

export function registerNoteIpc(
  vaultManager: VaultManager,
  noteParser: NoteParser,
  templateService: TemplateService
): void {
  ipcMain.handle(IPC_CHANNELS.NOTE_READ, async (_event, path: string) => {
    return vaultManager.readNote(path)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_WRITE, async (_event, path: string, content: string) => {
    await vaultManager.writeNote(path, content)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_DELETE, async (_event, path: string) => {
    await vaultManager.deleteNote(path)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_RENAME, async (_event, oldPath: string, newPath: string) => {
    await vaultManager.renameNote(oldPath, newPath)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_CREATE, async (_event, path: string, template?: string) => {
    const content = template ?? templateService.getDefaultTemplate(
      path.split('/').pop()?.replace('.html', '') ?? 'Untitled'
    )
    await vaultManager.createNote(path, content)
    return content
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_MOVE, async (_event, sourcePath: string, targetFolder: string) => {
    await vaultManager.moveNote(sourcePath, targetFolder)
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_GET_PROPERTIES, async (_event, path: string) => {
    const html = await vaultManager.readNote(path)
    const index = noteParser.parseNote(html, path)
    return {
      title: index.title,
      tags: index.tags,
      created: index.created,
      modified: index.modified,
      metadata: index.metadata,
    }
  })

  ipcMain.handle(IPC_CHANNELS.NOTE_SET_PROPERTIES, async (_event, path: string, properties) => {
    const html = await vaultManager.readNote(path)
    const updated = noteParser.updateProperties(html, properties)
    await vaultManager.writeNote(path, updated)
  })
}
