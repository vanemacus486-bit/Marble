import { useTranslation } from 'react-i18next'
import { File, Pencil, Trash2, Clipboard, Folder, ChevronLeft, ChevronRight, ChevronDown, Download } from 'lucide-react'
import { useVaultStore } from '../../stores/vault-store'
import { useEditorStore } from '../../stores/editor-store'
import { useUiStore } from '../../stores/ui-store'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useContextMenu } from '../../hooks/useContextMenu'
import type { ContextMenuItem } from '../ui/ContextMenu'
import CreateNoteDialog from '../dialogs/CreateNoteDialog'
import ConfirmDialog from '../dialogs/ConfirmDialog'
import type { FileEntry } from '../../types'
import { getEffectiveShortcut, formatShortcutKeys } from '../../config/shortcuts'

/* ---- Inline Rename Input ---- */

function InlineRenameInput({
  initialValue,
  isFile,
  onConfirm,
  onCancel,
}: {
  initialValue: string
  isFile: boolean
  onConfirm: (newName: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (isFile) {
      const dotIdx = initialValue.lastIndexOf('.')
      if (dotIdx > 0) {
        input.setSelectionRange(0, dotIdx)
      } else {
        input.select()
      }
    } else {
      input.select()
    }
  }, [initialValue, isFile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onConfirm(inputRef.current?.value ?? '')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className="w-full rounded border border-[var(--color-accent)] bg-[var(--color-bg-primary)] px-1 py-0 text-sm text-[var(--color-text-primary)] outline-none"
      defaultValue={initialValue}
      onKeyDown={handleKeyDown}
      onBlur={() => onConfirm(inputRef.current?.value ?? '')}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

/* ---- FileExplorer ---- */

export default function FileExplorer() {
  const { t } = useTranslation()
  const files = useVaultStore((s) => s.files)
  const openNote = useEditorStore((s) => s.openNote)
  const addToast = useUiStore((s) => s.addToast)
  const { showMenu } = useContextMenu()

  // Inline rename state
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renamingIsFile, setRenamingIsFile] = useState(false)

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<{
    path: string
    name: string
    isDirectory: boolean
  } | null>(null)

  // Create note dialog state
  const [createDialogFolder, setCreateDialogFolder] = useState<string | undefined>(undefined)

  const { folders, folderFiles } = useMemo(() => {
    const f = new Map<string, FileEntry[]>()
    const ff = new Map<string, FileEntry[]>()
    for (const entry of files) {
      if (entry.isDirectory) continue
      const dir = entry.path.includes('/') ? entry.path.substring(0, entry.path.lastIndexOf('/')) : ''
      const existing = ff.get(dir) ?? []
      existing.push(entry)
      ff.set(dir, existing)
    }
    for (const entry of files) {
      if (entry.isDirectory) {
        const existing = f.get(entry.path) ?? []
        f.set(entry.path, existing)
      }
    }
    return { folders: f, folderFiles: ff }
  }, [files])

  const rootFiles = folderFiles.get('') ?? []
  const rootFolders = Array.from(folders.keys()).filter(
    (p) => !p.includes('/'),
  )

  /* ---- Handlers ---- */

  const handleRename = useCallback(
    async (oldPath: string, newName: string, isDir: boolean) => {
      const trimmed = newName.trim()
      if (!trimmed) {
        addToast(t('fileExplorer.nameCannotBeEmpty'), 'error')
        return
      }

      if (/[<>:"/\\|?*]/.test(trimmed)) {
        addToast(t('fileExplorer.invalidCharacters'), 'error')
        return
      }

      const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : ''
      const newPath = parentDir ? `${parentDir}/${trimmed}` : trimmed

      // No change
      if (oldPath === newPath) return

      try {
        if (isDir) {
          await window.electronAPI.renameFolder(oldPath, newPath)
        } else {
          await window.electronAPI.renameNote(oldPath, newPath)
        }
        await useVaultStore.getState().refreshFiles()
        addToast(t('fileExplorer.renamedSuccess'), 'success')
      } catch (e) {
        addToast(t('fileExplorer.renameFailed', { message: (e as Error).message }), 'error')
      }
    },
    [addToast, t],
  )

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.isDirectory) {
        await window.electronAPI.deleteFolder(confirmDelete.path)
      } else {
        await window.electronAPI.deleteNote(confirmDelete.path)
      }
      await useVaultStore.getState().refreshFiles()
      addToast(t('fileExplorer.deletedSuccess'), 'success')
    } catch (e) {
      addToast(t('fileExplorer.deleteFailed', { message: (e as Error).message }), 'error')
    } finally {
      setConfirmDelete(null)
    }
  }, [confirmDelete, addToast, t])

  const handleCopyPath = useCallback(
    async (path: string) => {
      try {
        await navigator.clipboard.writeText(path)
        addToast(t('fileExplorer.pathCopied'), 'success')
      } catch {
        addToast(t('fileExplorer.copyPathFailed'), 'error')
      }
    },
    [addToast, t],
  )

  const startRename = useCallback((path: string, isFile: boolean) => {
    setRenamingPath(path)
    setRenamingIsFile(isFile)
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingPath(null)
  }, [])

  /* ---- Context Menu Builders ---- */

  const iconCls = 'h-3.5 w-3.5'

  const getFileMenuItems = useCallback(
    (entry: FileEntry): ContextMenuItem[] => [
      {
        id: 'open',
        label: t('fileExplorer.contextOpen'),
        icon: <File className={iconCls} />,
        onClick: () => openNote(entry.path),
      },
      { type: 'separator' },
      {
        id: 'rename',
        label: t('fileExplorer.contextRename'),
        icon: <Pencil className={iconCls} />,
        onClick: () => startRename(entry.path, true),
      },
      {
        id: 'delete',
        label: t('fileExplorer.contextDelete'),
        icon: <Trash2 className={iconCls} />,
        danger: true,
        onClick: () =>
          setConfirmDelete({ path: entry.path, name: entry.name, isDirectory: false }),
      },
      { type: 'separator' },
      {
        id: 'copy-path',
        label: t('fileExplorer.contextCopyPath'),
        icon: <Clipboard className={iconCls} />,
        shortcut: 'Ctrl+Shift+C',
        onClick: () => handleCopyPath(entry.path),
      },
      {
        id: 'export-html',
        label: 'Export as HTML',
        icon: <Download className={iconCls} />,
        onClick: async () => {
          const content = await window.electronAPI.readNote(entry.path)
          const title = entry.name.replace('.html', '')
          await window.electronAPI.exportHtmlFile(content, title)
        },
      },
    ],
    [openNote, startRename, handleCopyPath, t],
  )

  const getFolderMenuItems = useCallback(
    (folderPath: string, folderName: string): ContextMenuItem[] => [
      {
        id: 'new-note',
        label: t('fileExplorer.contextNewNote'),
        icon: <File className={iconCls} />,
        onClick: () => setCreateDialogFolder(folderPath),
      },
      {
        id: 'new-folder',
        label: t('fileExplorer.contextNewFolder'),
        icon: <Folder className={iconCls} />,
        onClick: () => startRename(`${folderPath}/new-folder`, false),
      },
      { type: 'separator' },
      {
        id: 'rename',
        label: t('fileExplorer.contextRename'),
        icon: <Pencil className={iconCls} />,
        onClick: () => startRename(folderPath, false),
      },
      {
        id: 'delete',
        label: t('fileExplorer.contextDelete'),
        icon: <Trash2 className={iconCls} />,
        danger: true,
        onClick: () =>
          setConfirmDelete({ path: folderPath, name: folderName, isDirectory: true }),
      },
      { type: 'separator' },
      {
        id: 'collapse-all',
        label: t('fileExplorer.contextCollapseAll'),
        icon: <ChevronLeft className={iconCls} />,
        onClick: () => addToast(t('fileExplorer.collapsedAll'), 'info'),
      },
    ],
    [startRename, addToast, t],
  )

  const getEmptySpaceMenuItems = useCallback(
    (): ContextMenuItem[] => [
      {
        id: 'new-note',
        label: t('fileExplorer.contextNewNote'),
        icon: <File className={iconCls} />,
        onClick: () => setCreateDialogFolder(undefined),
      },
      {
        id: 'new-folder',
        label: t('fileExplorer.contextNewFolder'),
        icon: <Folder className={iconCls} />,
        onClick: () => startRename('new-folder', false),
      },
    ],
    [startRename, t],
  )

  /* ---- Legacy create handlers (button toolbar) ---- */

  const handleCreateNote = async (folder: string) => {
    const name = `untitled-${Date.now()}.html`
    const path = folder ? `${folder}/${name}` : name
    try {
      await window.electronAPI.createNote(path)
      addToast(t('fileExplorer.noteCreated'), 'success')
      await useVaultStore.getState().refreshFiles()
    } catch {
      addToast(t('fileExplorer.createNoteFailed'), 'error')
    }
  }

  const handleCreateFolder = async (parentFolder: string) => {
    const name = `folder-${Date.now()}`
    const path = parentFolder ? `${parentFolder}/${name}` : name
    try {
      await window.electronAPI.createFolder(path)
      await useVaultStore.getState().refreshFiles()
    } catch {
      addToast(t('fileExplorer.createFolderFailed'), 'error')
    }
  }

  const handleCollapseAll = () => {
    addToast(t('fileExplorer.collapsedAll'), 'info')
  }

  const handleSpaceContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      showMenu(getEmptySpaceMenuItems(), { x: e.clientX, y: e.clientY })
    },
    [showMenu, getEmptySpaceMenuItems],
  )

  const newNoteShortcut = getEffectiveShortcut('new-note')
  const newFolderShortcut = getEffectiveShortcut('new-folder')

  return (
    <>
      <div className="p-2" onContextMenu={handleSpaceContextMenu}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">{t('fileExplorer.explorer')}</span>
          <div className="flex gap-1">
            <button
              className="rounded p-1 text-xs hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => handleCreateNote('')}
              title={`${t('fileExplorer.newNote')}${newNoteShortcut ? ` (${formatShortcutKeys(newNoteShortcut)})` : ''}`}
            >
              +📄
            </button>
            <button
              className="rounded p-1 text-xs hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => handleCreateFolder('')}
              title={`${t('fileExplorer.newFolder')}${newFolderShortcut ? ` (${formatShortcutKeys(newFolderShortcut)})` : ''}`}
            >
              +📁
            </button>
            <button
              className="rounded p-1 text-xs hover:bg-[var(--color-bg-tertiary)]"
              onClick={handleCollapseAll}
              title={t('fileExplorer.collapseAll')}
            >
              ⊟
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
              renamingPath={renamingPath}
              renamingIsFile={renamingIsFile}
              onStartRename={startRename}
              onCancelRename={cancelRename}
              onConfirmRename={handleRename}
              onShowMenu={showMenu}
              getFolderMenuItems={getFolderMenuItems}
              getFileMenuItems={getFileMenuItems}
            />
          ))}
          {rootFiles
            .filter((f) => f.name.endsWith('.html'))
            .map((f) => (
              <FileItem
                key={f.path}
                entry={f}
                openNote={openNote}
                renamingPath={renamingPath}
                renamingIsFile={renamingIsFile}
                onStartRename={startRename}
                onCancelRename={cancelRename}
                onConfirmRename={handleRename}
                onShowMenu={showMenu}
                getFileMenuItems={getFileMenuItems}
              />
            ))}
        </div>
      </div>

      {/* Create Note Dialog */}
      {createDialogFolder !== undefined && (
        <CreateNoteDialog
          onClose={() => setCreateDialogFolder(undefined)}
          defaultFolder={createDialogFolder}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          title={t('fileExplorer.confirmDeleteTitle')}
          message={t('fileExplorer.confirmDeleteMessage', { name: confirmDelete.name })}
          confirmLabel={t('fileExplorer.contextDelete')}
          cancelLabel={t('confirmDialog.cancel')}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  )
}

/* ---- FileItem ---- */

function FileItem({
  entry,
  openNote,
  renamingPath,
  renamingIsFile,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onShowMenu,
  getFileMenuItems,
}: {
  entry: FileEntry
  openNote: (path: string) => Promise<void>
  renamingPath: string | null
  renamingIsFile: boolean
  onStartRename: (path: string, isFile: boolean) => void
  onCancelRename: () => void
  onConfirmRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>
  onShowMenu: (items: ContextMenuItem[], position: { x: number; y: number }) => void
  getFileMenuItems: (entry: FileEntry) => ContextMenuItem[]
}) {
  const isRenaming = renamingPath === entry.path
  const displayName = entry.name.replace('.html', '')

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShowMenu(getFileMenuItems(entry), { x: e.clientX, y: e.clientY })
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {isRenaming ? (
        <div className="px-2 py-1">
          <InlineRenameInput
            initialValue={entry.name}
            isFile={true}
            onConfirm={(newName) => onConfirmRename(entry.path, newName, false)}
            onCancel={onCancelRename}
          />
        </div>
      ) : (
        <button
          className="w-full truncate rounded px-2 py-1 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          onClick={() => openNote(entry.path)}
        >
          📄 {displayName}
        </button>
      )}
    </div>
  )
}

/* ---- FolderTree ---- */

function FolderTree({
  folder,
  folders,
  folderFiles,
  openNote,
  onCreateNote,
  onCreateFolder,
  renamingPath,
  renamingIsFile,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onShowMenu,
  getFolderMenuItems,
  getFileMenuItems,
}: {
  folder: string
  folders: Map<string, FileEntry[]>
  folderFiles: Map<string, FileEntry[]>
  openNote: (path: string) => Promise<void>
  onCreateNote: (folder: string) => void
  onCreateFolder: (folder: string) => void
  renamingPath: string | null
  renamingIsFile: boolean
  onStartRename: (path: string, isFile: boolean) => void
  onCancelRename: () => void
  onConfirmRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>
  onShowMenu: (items: ContextMenuItem[], position: { x: number; y: number }) => void
  getFolderMenuItems: (folderPath: string, folderName: string) => ContextMenuItem[]
  getFileMenuItems: (entry: FileEntry) => ContextMenuItem[]
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const name = folder.split('/').pop() ?? folder
  const isRenaming = renamingPath === folder

  const childFolders = Array.from(folders.keys()).filter(
    (p) => p.startsWith(folder + '/') && p.split('/').length === folder.split('/').length + 1,
  )

  const files = folderFiles.get(folder)?.filter((f) => f.name.endsWith('.html')) ?? []

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShowMenu(getFolderMenuItems(folder, name), { x: e.clientX, y: e.clientY })
  }

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded px-2 py-0.5 text-sm hover:bg-[var(--color-bg-tertiary)]"
        onContextMenu={handleContextMenu}
      >
        <button
          className="text-xs text-[var(--color-text-muted)]"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {isRenaming ? (
          <div className="flex-1">
            <InlineRenameInput
              initialValue={name}
              isFile={false}
              onConfirm={(newName) => onConfirmRename(folder, newName, true)}
              onCancel={onCancelRename}
            />
          </div>
        ) : (
          <span
            className="flex-1 truncate text-[var(--color-text-secondary)]"
            title={folder}
          >
            📁 {name}
          </span>
        )}

        <div className="hidden gap-0.5 group-hover:flex">
          <button
            className="text-xs hover:text-[var(--color-accent)]"
            onClick={(e) => {
              e.stopPropagation()
              onCreateNote(folder)
            }}
            title={t('fileExplorer.newNote')}
          >
            +📄
          </button>
          <button
            className="text-xs hover:text-[var(--color-accent)]"
            onClick={(e) => {
              e.stopPropagation()
              onCreateFolder(folder)
            }}
            title={t('fileExplorer.newFolder')}
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
              renamingPath={renamingPath}
              renamingIsFile={renamingIsFile}
              onStartRename={onStartRename}
              onCancelRename={onCancelRename}
              onConfirmRename={onConfirmRename}
              onShowMenu={onShowMenu}
              getFolderMenuItems={getFolderMenuItems}
              getFileMenuItems={getFileMenuItems}
            />
          ))}
          {files.map((f) => (
            <FileItem
              key={f.path}
              entry={f}
              openNote={openNote}
              renamingPath={renamingPath}
              renamingIsFile={renamingIsFile}
              onStartRename={onStartRename}
              onCancelRename={onCancelRename}
              onConfirmRename={onConfirmRename}
              onShowMenu={onShowMenu}
              getFileMenuItems={getFileMenuItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}
