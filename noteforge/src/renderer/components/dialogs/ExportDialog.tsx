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
        // Convert HTML to Markdown via Turndown, then copy
        const content = await convertHtmlToMarkdown(html)
        await copyToClipboard(content)
      } else if (format === 'html') {
        // Save HTML as file via save dialog
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="export-title"
      >
        <h2 id="export-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
          Export Note
        </h2>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-[var(--color-danger)] dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* Format selector */}
        <div className="mt-4">
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Format</label>
          <div className="mt-1 flex gap-2">
            {(
              [
                { id: 'plaintext', label: 'Plain Text' },
                { id: 'markdown', label: 'Markdown' },
                { id: 'html', label: 'HTML Page' },
              ] as { id: ExportFormat; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  format === opt.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                onClick={() => setFormat(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
            onClick={handleCopySnippet}
          >
            {copied ? 'Copied!' : 'Copy Raw'}
          </button>
          <button
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : copied ? 'Copied!' : format === 'html' ? 'Export HTML File' : `Export & Copy`}
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
    // Fallback if turndown is unavailable
    return stripHtml(html)
  }
}
