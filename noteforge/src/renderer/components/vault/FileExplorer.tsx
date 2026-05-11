import { useVaultStore } from '../../stores/vault-store'
import { useEditorStore } from '../../stores/editor-store'
import { useUiStore } from '../../stores/ui-store'
import { useState, useMemo } from 'react'
import type { FileEntry } from '../../types'

export default function FileExplorer() {
  const files = useVaultStore((s) => s.files)
  const openNote = useEditorStore((s) => s.openNote)
  const addToast = useUiStore((s) => s.addToast)

  const { folders, folderFiles } = useMemo(() => {
    const folders = new Map<string, FileEntry[]>()
    const folderFiles = new Map<string, FileEntry[]>()
    for (const f of files) {
      if (f.isDirectory) continue
      const dir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : ''
      const existing = folderFiles.get(dir) ?? []
      existing.push(f)
      folderFiles.set(dir, existing)
    }
    for (const f of files) {
      if (f.isDirectory) {
        const existing = folders.get(f.path) ?? []
        folders.set(f.path, existing)
      }
    }
    return { folders, folderFiles }
  }, [files])

  const rootFiles = folderFiles.get('') ?? []
  const rootFolders = Array.from(folders.keys()).filter(
    (p) => !p.includes('/')
  )

  const handleCreateNote = async (folder: string) => {
    const name = `untitled-${Date.now()}.html`
    const path = folder ? `${folder}/${name}` : name
    try {
      await window.electronAPI.createNote(path)
      addToast('Note created', 'success')
      useVaultStore.getState().refreshFiles()
    } catch {
      addToast('Failed to create note', 'error')
    }
  }

  const handleCreateFolder = async (parentFolder: string) => {
    const name = `folder-${Date.now()}`
    const path = parentFolder ? `${parentFolder}/${name}` : name
    try {
      await window.electronAPI.createFolder(path)
      useVaultStore.getState().refreshFiles()
    } catch {
      addToast('Failed to create folder', 'error')
    }
  }

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">EXPLORER</span>
        <div className="flex gap-1">
          <button
            className="rounded p-1 text-xs hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => handleCreateNote('')}
            title="New note"
          >
            +📄
          </button>
          <button
            className="rounded p-1 text-xs hover:bg-[var(--color-bg-tertiary)]"
            onClick={() => handleCreateFolder('')}
            title="New folder"
          >
            +📁
          </button>
        </div>
      </div>
      <div className="space-y-0.5">
        {rootFolders.map((folder) => (
          <FolderTree
            key={folder}
            folder={folder}
            folders={folders}
            folderFiles={folderFiles}
            openNote={openNote}
            onCreateNote={handleCreateNote}
            onCreateFolder={handleCreateFolder}
          />
        ))}
        {rootFiles
          .filter((f) => f.name.endsWith('.html'))
          .map((f) => (
            <button
              key={f.path}
              className="w-full truncate rounded px-2 py-1 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => openNote(f.path)}
            >
              📄 {f.name.replace('.html', '')}
            </button>
          ))}
      </div>
    </div>
  )
}

function FolderTree({
  folder,
  folders,
  folderFiles,
  openNote,
  onCreateNote,
  onCreateFolder,
}: {
  folder: string
  folders: Map<string, FileEntry[]>
  folderFiles: Map<string, FileEntry[]>
  openNote: (path: string) => Promise<void>
  onCreateNote: (folder: string) => void
  onCreateFolder: (folder: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const name = folder.split('/').pop() ?? folder

  const childFolders = Array.from(folders.keys()).filter(
    (p) => p.startsWith(folder + '/') && p.split('/').length === folder.split('/').length + 1
  )

  const files = folderFiles.get(folder)?.filter((f) => f.name.endsWith('.html')) ?? []

  return (
    <div>
      <div className="group flex items-center gap-1 rounded px-2 py-0.5 text-sm hover:bg-[var(--color-bg-tertiary)]">
        <button
          className="text-xs text-[var(--color-text-muted)]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <span
          className="flex-1 truncate text-[var(--color-text-secondary)]"
          title={folder}
        >
          📁 {name}
        </span>
        <div className="hidden gap-0.5 group-hover:flex">
          <button
            className="text-xs hover:text-[var(--color-accent)]"
            onClick={(e) => { e.stopPropagation(); onCreateNote(folder) }}
            title="New note"
          >
            +📄
          </button>
          <button
            className="text-xs hover:text-[var(--color-accent)]"
            onClick={(e) => { e.stopPropagation(); onCreateFolder(folder) }}
            title="New folder"
          >
            +📁
          </button>
        </div>
      </div>
      {expanded && (
        <div className="ml-3">
          {childFolders.map((cf) => (
            <FolderTree
              key={cf}
              folder={cf}
              folders={folders}
              folderFiles={folderFiles}
              openNote={openNote}
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
            />
          ))}
          {files.map((f) => (
            <button
              key={f.path}
              className="w-full truncate rounded px-2 py-1 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => openNote(f.path)}
            >
              📄 {f.name.replace('.html', '')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
