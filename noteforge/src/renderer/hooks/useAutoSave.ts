import { useEffect, useRef } from 'react'
import { useEditorStore } from '../stores/editor-store'
import { useVaultStore } from '../stores/vault-store'

export function useAutoSave(tabId: string) {
  const { config } = useVaultStore()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const autoSave = useEditorStore((s) => s.autoSave)

  useEffect(() => {
    const interval = config?.features.autoSaveInterval ?? 2000
    timerRef.current = setInterval(() => {
      autoSave(tabId)
    }, interval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [tabId, autoSave, config?.features.autoSaveInterval])

  // Also save on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      autoSave(tabId)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [tabId, autoSave])
}
