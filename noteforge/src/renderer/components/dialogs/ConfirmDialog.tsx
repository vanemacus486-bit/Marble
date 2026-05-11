import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-6 shadow-2xl"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2
          id="confirm-title"
          className={`text-lg font-semibold ${
            variant === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'
          }`}
        >
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`rounded-md px-4 py-1.5 text-sm text-white transition-colors ${
              variant === 'danger'
                ? 'bg-[var(--color-danger)] hover:bg-red-700'
                : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
