import { useCallback } from 'react'
import { useVaultStore } from '../stores/vault-store'

export function useVault() {
  const vaultPath = useVaultStore((s) => s.vaultPath)
  const vaultName = useVaultStore((s) => s.vaultName)
  const isLoaded = useVaultStore((s) => s.isLoaded)
  const isLoading = useVaultStore((s) => s.isLoading)
  const notes = useVaultStore((s) => s.notes)
  const files = useVaultStore((s) => s.files)
  const folders = useVaultStore((s) => s.folders)
  const config = useVaultStore((s) => s.config)
  const error = useVaultStore((s) => s.error)
  const openVaultFn = useVaultStore((s) => s.openVault)
  const closeVault = useVaultStore((s) => s.closeVault)
  const refreshFiles = useVaultStore((s) => s.refreshFiles)
  const setConfig = useVaultStore((s) => s.setConfig)
  const getNoteById = useVaultStore((s) => s.getNoteById)
  const getBacklinks = useVaultStore((s) => s.getBacklinks)

  const openVaultDialog = useCallback(async () => {
    const path = await window.electronAPI.openVaultDialog()
    if (path) {
      await openVaultFn(path)
    }
    return path
  }, [openVaultFn])

  return {
    vaultPath,
    vaultName,
    isLoaded,
    isLoading,
    notes,
    files,
    folders,
    config,
    error,
    openVault: openVaultFn,
    openVaultDialog,
    closeVault,
    refreshFiles,
    setConfig,
    getNoteById,
    getBacklinks,
  }
}
