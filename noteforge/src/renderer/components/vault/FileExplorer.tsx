import { useTranslation } from 'react-i18next'
import { File, Pencil, Trash2, Clipboard, Folder, ChevronRight, ChevronDown, Download } from 'lucide-react'
import { useVaultStore } from '../../stores/vault-store'
import { useEditorStore } from '../../stores/editor-store'
import { useUiStore } from '../../stores/ui-store'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useContextMenu } from '../../hooks/useContextMenu'
import type { ContextMenuItem } from '../ui/ContextMenu'
import CreateNoteDialog from '../dialogs/CreateNoteDialog'
import ConfirmDialog from '../dialogs/ConfirmDialog'
import type { FileEntry } from '../../types'
import SideHead from '../layout/SideHead'

function InlineRenameInput({
  initialValue, isFile, onConfirm, onCancel,
}: {
  initialValue: string; isFile: boolean; onConfirm: (n: string) => void; onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (isFile) {
      const dotIdx = initialValue.lastIndexOf('.')
      if (dotIdx > 0) input.setSelectionRange(0, dotIdx)
      else input.select()
    } else input.select()
  }, [initialValue, isFile])

  return (
    <input
      ref={inputRef}
      style={{
        width: '100%', borderRadius: 4,
        border: '1px solid var(--m-vein)',
        background: 'var(--m-bg)', padding: '1px 4px',
        fontSize: 12.5, color: 'var(--m-fg)', outline: 'none',
      }}
      defaultValue={initialValue}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onConfirm(inputRef.current?.value ?? '') }
        else if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
      onBlur={() => onConfirm(inputRef.current?.value ?? '')}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export default function FileExplorer() {
  const { t } = useTranslation()
  const files = useVaultStore((s) => s.files)
  const openNote = useEditorStore((s) => s.openNote)
  const addToast = useUiStore((s) => s.addToast)
  const { showMenu } = useContextMenu()

  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renamingIsFile, setRenamingIsFile] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ path: string; name: string; isDirectory: boolean } | null>(null)
  const [createDialogFolder, setCreateDialogFolder] = useState<string | undefined>(undefined)

  const { folders, folderFiles } = useMemo(() => {
    const f = new Map<string, FileEntry[]>()
    const ff = new Map<string, FileEntry[]>()
    for (const entry of files) {
      if (entry.isDirectory) continue
      const dir = entry.path.includes('/') ? entry.path.substring(0, entry.path.lastIndexOf('/')) : ''
      ff.set(dir, [...(ff.get(dir) ?? []), entry])
    }
    for (const entry of files) {
      if (entry.isDirectory) f.set(entry.path, [])
    }
    return { folders: f, folderFiles: ff }
  }, [files])

  const rootFiles = folderFiles.get('') ?? []
  const rootFolders = Array.from(folders.keys()).filter((p) => !p.includes('/'))

  const handleRename = useCallback(async (oldPath: string, newName: string, isDir: boolean) => {
    const trimmed = newName.trim()
    if (!trimmed) { addToast(t('fileExplorer.nameCannotBeEmpty'), 'error'); return }
    if (/[<>:"/\\|?*]/.test(trimmed)) { addToast(t('fileExplorer.invalidCharacters'), 'error'); return }
    const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : ''
    const newPath = parentDir ? `${parentDir}/${trimmed}` : trimmed
    if (oldPath === newPath) return
    try {
      if (isDir) await window.electronAPI.renameFolder(oldPath, newPath)
      else await window.electronAPI.renameNote(oldPath, newPath)
      await useVaultStore.getState().refreshFiles()
      addToast(t('fileExplorer.renamedSuccess'), 'success')
    } catch (e) { addToast(t('fileExplorer.renameFailed', { message: (e as Error).message }), 'error') }
  }, [addToast, t])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.isDirectory) await window.electronAPI.deleteFolder(confirmDelete.path)
      else await window.electronAPI.deleteNote(confirmDelete.path)
      await useVaultStore.getState().refreshFiles()
      addToast(t('fileExplorer.deletedSuccess'), 'success')
    } catch (e) { addToast(t('fileExplorer.deleteFailed', { message: (e as Error).message }), 'error') }
    finally { setConfirmDelete(null) }
  }, [confirmDelete, addToast, t])

  const handleCopyPath = useCallback(async (path: string) => {
    try { await navigator.clipboard.writeText(path); addToast(t('fileExplorer.pathCopied'), 'success') }
    catch { addToast(t('fileExplorer.copyPathFailed'), 'error') }
  }, [addToast, t])

  const startRename = useCallback((path: string, isFile: boolean) => { setRenamingPath(path); setRenamingIsFile(isFile) }, [])
  const cancelRename = useCallback(() => setRenamingPath(null), [])

  const iconCls = 'h-3.5 w-3.5'
  const getFileMenuItems = useCallback((entry: FileEntry): ContextMenuItem[] => [
    { id: 'open', label: t('fileExplorer.contextOpen'), icon: <File className={iconCls} />, onClick: () => openNote(entry.path) },
    { type: 'separator' },
    { id: 'rename', label: t('fileExplorer.contextRename'), icon: <Pencil className={iconCls} />, onClick: () => startRename(entry.path, true) },
    { id: 'delete', label: t('fileExplorer.contextDelete'), icon: <Trash2 className={iconCls} />, danger: true, onClick: () => setConfirmDelete({ path: entry.path, name: entry.name, isDirectory: false }) },
    { type: 'separator' },
    { id: 'copy-path', label: t('fileExplorer.contextCopyPath'), icon: <Clipboard className={iconCls} />, onClick: () => handleCopyPath(entry.path) },
    { id: 'export-html', label: 'Export as HTML', icon: <Download className={iconCls} />, onClick: async () => { const content = await window.electronAPI.readNote(entry.path); await window.electronAPI.exportHtmlFile(content, entry.name.replace('.html', '')) } },
  ], [openNote, startRename, handleCopyPath, t])

  const getFolderMenuItems = useCallback((folderPath: string, folderName: string): ContextMenuItem[] => [
    { id: 'new-note', label: t('fileExplorer.contextNewNote'), icon: <File className={iconCls} />, onClick: () => setCreateDialogFolder(folderPath) },
    { id: 'new-folder', label: t('fileExplorer.contextNewFolder'), icon: <Folder className={iconCls} />, onClick: () => startRename(`${folderPath}/new-folder`, false) },
    { type: 'separator' },
    { id: 'rename', label: t('fileExplorer.contextRename'), icon: <Pencil className={iconCls} />, onClick: () => startRename(folderPath, false) },
    { id: 'delete', label: t('fileExplorer.contextDelete'), icon: <Trash2 className={iconCls} />, danger: true, onClick: () => setConfirmDelete({ path: folderPath, name: folderName, isDirectory: true }) },
  ], [startRename, t])

  const getEmptySpaceMenuItems = useCallback((): ContextMenuItem[] => [
    { id: 'new-note', label: t('fileExplorer.contextNewNote'), icon: <File className={iconCls} />, onClick: () => setCreateDialogFolder(undefined) },
    { id: 'new-folder', label: t('fileExplorer.contextNewFolder'), icon: <Folder className={iconCls} />, onClick: () => startRename('new-folder', false) },
  ], [startRename, t])

  const handleSpaceContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    showMenu(getEmptySpaceMenuItems(), { x: e.clientX, y: e.clientY })
  }, [showMenu, getEmptySpaceMenuItems])

  const totalNotes = files.filter((f) => !f.isDirectory).length

  return (
    <>
      <div style={{ padding: 10 }} onContextMenu={handleSpaceContextMenu}>
        <SideHead action={<span className="m-kbd">{totalNotes}</span>}>
          {t('fileExplorer.explorer')}
        </SideHead>

        {rootFolders.map((folder) => (
          <FolderTree key={folder} folder={folder} folders={folders} folderFiles={folderFiles}
            openNote={openNote} renamingPath={renamingPath} renamingIsFile={renamingIsFile}
            onStartRename={startRename} onCancelRename={cancelRename} onConfirmRename={handleRename}
            onShowMenu={showMenu} getFolderMenuItems={getFolderMenuItems} getFileMenuItems={getFileMenuItems} />
        ))}
        {rootFiles.filter((f) => f.name.endsWith('.html')).map((f) => (
          <FileItem key={f.path} entry={f} openNote={openNote}
            renamingPath={renamingPath} renamingIsFile={renamingIsFile}
            onStartRename={startRename} onCancelRename={cancelRename} onConfirmRename={handleRename}
            onShowMenu={showMenu} getFileMenuItems={getFileMenuItems} />
        ))}
      </div>

      <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--m-line-soft)', fontSize: '10.5px', fontFamily: 'var(--f-mono)', color: 'var(--m-fg-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 2px' }}>
          <span>vault</span><span style={{ color: 'var(--m-fg-1)' }}>{rootFolders.length}f · {totalNotes}n</span>
        </div>
      </div>

      {createDialogFolder !== undefined && <CreateNoteDialog onClose={() => setCreateDialogFolder(undefined)} defaultFolder={createDialogFolder} />}
      {confirmDelete && (
        <ConfirmDialog title={t('fileExplorer.confirmDeleteTitle')}
          message={t('fileExplorer.confirmDeleteMessage', { name: confirmDelete.name })}
          confirmLabel={t('fileExplorer.contextDelete')} cancelLabel={t('confirmDialog.cancel')}
          variant="danger" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </>
  )
}

function FileItem({ entry, openNote, renamingPath, renamingIsFile, onStartRename, onCancelRename, onConfirmRename, onShowMenu, getFileMenuItems }: {
  entry: FileEntry; openNote: (p: string) => Promise<void>
  renamingPath: string | null; renamingIsFile: boolean
  onStartRename: (p: string, f: boolean) => void; onCancelRename: () => void
  onConfirmRename: (old: string, n: string, d: boolean) => Promise<void>
  onShowMenu: (items: ContextMenuItem[], pos: { x: number; y: number }) => void
  getFileMenuItems: (e: FileEntry) => ContextMenuItem[]
}) {
  const isRenaming = renamingPath === entry.path
  const displayName = entry.name.replace('.html', '')

  if (isRenaming) {
    return (
      <div style={{ padding: '2px 8px' }}>
        <InlineRenameInput initialValue={entry.name} isFile={true}
          onConfirm={(n) => onConfirmRename(entry.path, n, false)} onCancel={onCancelRename} />
      </div>
    )
  }

  return (
    <div onClick={() => openNote(entry.path)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onShowMenu(getFileMenuItems(entry), { x: e.clientX, y: e.clientY }) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', height: 22,
        borderRadius: 4, cursor: 'pointer', fontSize: '12.5px', color: 'var(--m-fg-1)',
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, fontWeight: 600, color: 'var(--m-fg-3)' }}>&lt;/&gt;</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
      <span style={{ fontSize: '10.5px', color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)' }}>.html</span>
    </div>
  )
}

function FolderTree({ folder, folders, folderFiles, openNote, renamingPath, renamingIsFile, onStartRename, onCancelRename, onConfirmRename, onShowMenu, getFolderMenuItems, getFileMenuItems, depth = 0 }: {
  folder: string; folders: Map<string, FileEntry[]>; folderFiles: Map<string, FileEntry[]>
  openNote: (p: string) => Promise<void>; renamingPath: string | null; renamingIsFile: boolean
  onStartRename: (p: string, f: boolean) => void; onCancelRename: () => void
  onConfirmRename: (old: string, n: string, d: boolean) => Promise<void>
  onShowMenu: (items: ContextMenuItem[], pos: { x: number; y: number }) => void
  getFolderMenuItems: (fp: string, fn: string) => ContextMenuItem[]
  getFileMenuItems: (e: FileEntry) => ContextMenuItem[]
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const name = folder.split('/').pop() ?? folder
  const isRenaming = renamingPath === folder
  const childFolders = Array.from(folders.keys()).filter((p) => p.startsWith(folder + '/') && p.split('/').length === folder.split('/').length + 1)
  const files = folderFiles.get(folder)?.filter((f) => f.name.endsWith('.html')) ?? []

  return (
    <div>
      <div onClick={() => setExpanded(!expanded)}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onShowMenu(getFolderMenuItems(folder, name), { x: e.clientX, y: e.clientY }) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 0',
          paddingLeft: 8 + depth * 12, height: 22, borderRadius: 4, cursor: 'pointer',
          color: 'var(--m-fg-1)', fontSize: '12.5px',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'oklch(0.20 0.006 260)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ color: 'var(--m-fg-3)', display: 'flex' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {isRenaming ? (
          <div style={{ flex: 1 }}>
            <InlineRenameInput initialValue={name} isFile={false}
              onConfirm={(n) => onConfirmRename(folder, n, true)} onCancel={onCancelRename} />
          </div>
        ) : (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        )}
      </div>
      {expanded && (
        <div>
          {childFolders.map((cf) => (
            <FolderTree key={cf} folder={cf} folders={folders} folderFiles={folderFiles}
              openNote={openNote} renamingPath={renamingPath} renamingIsFile={renamingIsFile}
              onStartRename={onStartRename} onCancelRename={onCancelRename} onConfirmRename={onConfirmRename}
              onShowMenu={onShowMenu} getFolderMenuItems={getFolderMenuItems} getFileMenuItems={getFileMenuItems}
              depth={depth + 1} />
          ))}
          {files.map((f) => (
            <div key={f.path} style={{ paddingLeft: (depth + 1) * 12 }}>
              <FileItem entry={f} openNote={openNote}
                renamingPath={renamingPath} renamingIsFile={renamingIsFile}
                onStartRename={onStartRename} onCancelRename={onCancelRename} onConfirmRename={onConfirmRename}
                onShowMenu={onShowMenu} getFileMenuItems={getFileMenuItems} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
