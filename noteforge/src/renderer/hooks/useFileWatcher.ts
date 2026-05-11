import { useEffect, useRef } from 'react'
import { useVaultStore } from '../stores/vault-store'
import type { FileChangeEvent } from '../types'

export function useFileWatcher() {
  const { refreshFiles, vaultPath } = useVaultStore()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!vaultPath) return

    unsubscribeRef.current = window.electronAPI.subscribeToChanges(
      (event: FileChangeEvent) => {
        // Debounce rapid changes
        if (event.type === 'change' || event.type === 'add' || event.type === 'unlink') {
          refreshFiles()
        }
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [vaultPath, refreshFiles])
}
