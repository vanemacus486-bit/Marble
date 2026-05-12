import { useState } from 'react'
import { stripHtml, copyToClipboard } from '../../utils/clipboard-utils'

interface ExportDialogProps {
  onClose: () => void
  html: string
}

type ExportFormat = 'plaintext' | 'markdown' | 'html'

export default function ExportDialog({ onClose, html }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('plaintext')
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    try {
      if (format === 'plaintext') {
        const plaintext = await window.electronAPI.exportPlaintext(html)
        await copyToClipboard(plaintext)
      } else if (format === 'markdown') {
        const content = await convertHtmlToMarkdown(html)
        await copyToClipboard(content)
      } else if (format === 'html') {
        await window.electronAPI.exportHtmlFile(html, '')
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      setError(`Export failed: ${(e as Error).message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopySnippet = async () => {
    try {
      const plaintext = stripHtml(html)
      await copyToClipboard(plaintext)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      setError(`Copy failed: ${(e as Error).message}`)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 10,
          background: 'var(--m-bg-1)',
          border: '1px solid var(--m-line)',
          padding: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
        role="dialog"
        aria-labelledby="export-title"
      >
        <h2
          id="export-title"
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--m-fg)',
            margin: 0,
          }}
        >
          Export Note
        </h2>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'oklch(0.32 0.05 25 / 0.18)',
              color: 'var(--c-red)',
              fontSize: 12,
              border: '1px solid var(--m-line-soft)',
            }}
          >
            {error}
          </div>
        )}

        {/* Format selector */}
        <div style={{ marginTop: 16 }}>
          <label
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--m-fg-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Format
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {(
              [
                { id: 'plaintext', label: 'Plain Text' },
                { id: 'markdown', label: 'Markdown' },
                { id: 'html', label: 'HTML Page' },
              ] as { id: ExportFormat; label: string }[]
            ).map((opt) => {
              const isActive = format === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: isActive ? '1px solid var(--m-vein-dim)' : '1px solid var(--m-line)',
                    background: isActive ? 'var(--m-vein-bg)' : 'var(--m-bg)',
                    color: isActive ? 'var(--m-vein)' : 'var(--m-fg-1)',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'transparent',
              color: 'var(--m-fg-1)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCopySnippet}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--m-line)',
              background: 'var(--m-bg)',
              color: 'var(--m-fg-1)',
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy Raw'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 0,
              background: 'var(--m-vein)',
              color: 'var(--m-bg)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            {isExporting
              ? 'Exporting...'
              : copied
                ? 'Copied!'
                : format === 'html'
                  ? 'Export HTML File'
                  : 'Export & Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

async function convertHtmlToMarkdown(html: string): Promise<string> {
  try {
    const TurndownService = (await import('turndown')).default
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    })
    return turndown.turndown(html)
  } catch {
    return stripHtml(html)
  }
}
