import { useState, useEffect, useCallback, useRef } from 'react'
import { FolderOpen, ChevronRight, Loader2 } from 'lucide-react'
import { useVault } from '../../hooks/useVault'
import { useUiStore } from '../../stores/ui-store'

export default function WelcomeScreen() {
  const [recentVaults, setRecentVaults] = useState<string[]>([])
  const [autoOpening, setAutoOpening] = useState(false)
  const { openVaultDialog, openVault } = useVault()
  const addToast = useUiStore((s) => s.addToast)
  const triedAutoOpen = useRef(false)

  useEffect(() => {
    if (triedAutoOpen.current) return
    triedAutoOpen.current = true

    window.electronAPI.getAppConfig().then(async (config) => {
      setRecentVaults(config.recentVaults)

      if (config.lastVaultPath) {
        setAutoOpening(true)
        try {
          await openVault(config.lastVaultPath)
          return
        } catch {
          addToast('Last vault is no longer accessible', 'error')
        } finally {
          setAutoOpening(false)
        }
      }
    })
  }, [openVault, addToast])

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

  if (autoOpening) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--m-bg-1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            color: 'var(--m-fg-3)',
          }}
        >
          <Loader2 className="h-8 w-8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13 }}>Opening vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--m-bg-1)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        {/* Marble logo mark */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            className="marble-mark"
            style={{ width: 48, height: 48, borderRadius: 10 }}
          />
        </div>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--m-fg)',
            margin: 0,
          }}
        >
          Marble
        </h1>

        <p
          style={{
            marginTop: 6,
            fontSize: 14,
            color: 'var(--m-fg-3)',
            lineHeight: 1.5,
          }}
        >
          HTML-Native Knowledge Management
        </p>

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleOpenVault}
            style={{
              display: 'inline-flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 8,
              background: 'var(--m-vein)',
              color: 'var(--m-bg)',
              fontWeight: 600,
              fontSize: 13,
              border: 0,
              cursor: 'pointer',
            }}
          >
            <FolderOpen style={{ width: 18, height: 18 }} />
            Open Vault
          </button>
        </div>

        {recentVaults.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--m-fg-3)',
                marginBottom: 8,
              }}
            >
              Recent Vaults
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentVaults.map((path) => (
                <button
                  key={path}
                  onClick={() => handleRecentClick(path)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--m-fg-1)',
                    fontSize: 12.5,
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--m-bg-2)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--m-fg-3)' }} />
                  <span style={{ fontWeight: 500 }}>{path.split(/[/\\]/).pop()}</span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                      color: 'var(--m-fg-3)',
                    }}
                  >
                    {path}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p
          style={{
            marginTop: 40,
            fontSize: 11,
            color: 'var(--m-fg-3)',
            lineHeight: 1.6,
            fontFamily: 'var(--f-mono)',
          }}
        >
          Notes are stored as HTML files on your local filesystem.
          <br />
          No cloud. No lock-in. Your data, your files.
        </p>
      </div>
    </div>
  )
}
