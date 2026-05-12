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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 10,
          background: 'var(--m-bg-1)',
          border: '1px solid var(--m-line)',
          padding: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h2
          id="confirm-title"
          style={{
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
            color: variant === 'danger' ? 'var(--c-red)' : 'var(--m-fg)',
          }}
        >
          {title}
        </h2>
        <p
          id="confirm-message"
          style={{
            marginTop: 8,
            fontSize: 12.5,
            color: 'var(--m-fg-1)',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
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
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 0,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              background: variant === 'danger' ? 'var(--c-red)' : 'var(--m-vein)',
              color: variant === 'danger' ? '#fff' : 'var(--m-bg)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
