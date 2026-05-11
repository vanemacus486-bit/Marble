import { useState, useEffect, useCallback } from 'react'
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
        <h1 className="text-5xl font-bold text-[var(--color-text-primary)]">Marble</h1>
        <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
          HTML-Native Knowledge Management
        </p>
        <div className="mt-10 space-y-3">
          <button
            className="w-full rounded-lg bg-[var(--color-accent)] px-6 py-3 text-white shadow-md transition-colors hover:bg-[var(--color-accent-hover)]"
            onClick={handleOpenVault}
          >
            Open Vault
          </button>
        </div>
        {recentVaults.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Recent Vaults</h3>
            <div className="mt-2 space-y-1">
              {recentVaults.map((path) => (
                <button
                  key={path}
                  className="w-full truncate rounded-lg px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
                  onClick={() => handleRecentClick(path)}
                >
                  {path.split(/[/\\]/).pop()} — {path}
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
