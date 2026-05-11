import { useState, useEffect, useCallback } from 'react'
import { BookOpen, FolderOpen, ChevronRight } from 'lucide-react'
import { useVault } from '../../hooks/useVault'
import { useUiStore } from '../../stores/ui-store'

export default function WelcomeScreen() {
  const [recentVaults, setRecentVaults] = useState<string[]>([])
  const { openVaultDialog, openVault } = useVault()
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    window.electronAPI.getAppConfig().then((config) => {
      setRecentVaults(config.recentVaults)
    })
  }, [])

  const handleOpenVault = useCallback(async () => {
    const path = await openVaultDialog()
    if (path) {
      await openVault(path)
    }
  }, [openVaultDialog, openVault])

  const handleRecentClick = async (path: string) => {
    try {
      await openVault(path)
    } catch {
      addToast('Vault not found', 'error')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-accent)] shadow-lg">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">Marble</h1>
        <p className="mt-2 text-base text-[var(--color-text-secondary)]">
          HTML-Native Knowledge Management
        </p>
        <div className="mt-8 space-y-3">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-white shadow-md transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-lg"
            onClick={handleOpenVault}
          >
            <FolderOpen className="h-5 w-5" />
            Open Vault
          </button>
        </div>
        {recentVaults.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Recent Vaults</h3>
            <div className="space-y-1">
              {recentVaults.map((path) => (
                <button
                  key={path}
                  className="flex w-full items-center gap-2 truncate rounded-lg px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
                  onClick={() => handleRecentClick(path)}
                >
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
                  <span className="font-medium">{path.split(/[/\\]/).pop()}</span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">{path}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mt-12 text-xs text-[var(--color-text-muted)]">
          Notes are stored as HTML files on your local filesystem.
          <br />
          No cloud. No lock-in. Your data, your files.
        </p>
      </div>
    </div>
  )
}
