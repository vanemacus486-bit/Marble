import React from 'react'
import type { AIPendingApproval } from '../../../main/types/ipc-contracts'

interface DiffPreviewProps {
  approval: AIPendingApproval
  onApprove: () => void
  onReject: () => void
}

function simpleDiff(oldText: string, newText: string): Array<{ type: 'same' | 'add' | 'remove'; text: string }> {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: Array<{ type: 'same' | 'add' | 'remove'; text: string }> = []

  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < oldLines.length && i < newLines.length) {
      if (oldLines[i] === newLines[i]) {
        result.push({ type: 'same', text: oldLines[i] })
      } else {
        result.push({ type: 'remove', text: oldLines[i] })
        result.push({ type: 'add', text: newLines[i] })
      }
    } else if (i < oldLines.length) {
      result.push({ type: 'remove', text: oldLines[i] })
    } else {
      result.push({ type: 'add', text: newLines[i] })
    }
  }

  return result
}

export default function DiffPreview({ approval, onApprove, onReject }: DiffPreviewProps) {
  const { preview } = approval

  return (
    <div style={{
      border: '1px solid var(--m-line)',
      borderRadius: 6,
      background: 'var(--m-bg-1)',
      fontSize: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--m-line-soft)',
        background: 'var(--m-bg-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: preview.type === 'delete' ? 'var(--c-red)' :
                   preview.type === 'create' ? 'var(--c-green)' :
                   preview.type === 'rename' ? '#b8860b' : 'var(--m-vein)',
            background: preview.type === 'delete' ? 'rgba(239,68,68,0.1)' :
                        preview.type === 'create' ? 'rgba(34,197,94,0.1)' :
                        preview.type === 'rename' ? 'rgba(184,134,11,0.1)' : 'var(--m-vein-bg)',
          }}>
            {preview.type}
          </span>
          <span style={{ color: 'var(--m-fg)', fontWeight: 500 }}>{preview.path}</span>
          {preview.newPath && (
            <span style={{ color: 'var(--m-fg-3)' }}>→ {preview.newPath}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onReject}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid var(--c-red)',
              background: 'transparent',
              color: 'var(--c-red)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              background: 'var(--m-vein)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Approve
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8 }}>
        {preview.type === 'delete' && (
          <div style={{ padding: 12, color: 'var(--c-red)' }}>
            This note will be permanently deleted.
          </div>
        )}

        {preview.type === 'rename' && (
          <div style={{ padding: 12, color: 'var(--m-fg-2)' }}>
            Rename <code style={{ color: 'var(--m-fg)' }}>{preview.path}</code> to{' '}
            <code style={{ color: 'var(--m-fg)' }}>{preview.newPath}</code>
          </div>
        )}

        {preview.type === 'create' && preview.newContent && (
          <pre style={{
            margin: 0,
            padding: 12,
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--c-green)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--f-mono)',
          }}>
            {preview.newContent.slice(0, 5000)}
            {preview.newContent.length > 5000 && '\n... (truncated)'}
          </pre>
        )}

        {preview.type === 'write' && preview.oldContent !== undefined && preview.newContent && (
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, lineHeight: 1.6 }}>
            {simpleDiff(preview.oldContent, preview.newContent).map((line, i) => (
              <div
                key={i}
                style={{
                  padding: '1px 8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: line.type === 'add' ? 'rgba(34,197,94,0.08)' :
                              line.type === 'remove' ? 'rgba(239,68,68,0.08)' : 'transparent',
                  color: line.type === 'add' ? 'var(--c-green)' :
                         line.type === 'remove' ? 'var(--c-red)' : 'var(--m-fg-2)',
                }}
              >
                {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
                {line.text}
              </div>
            ))}
          </div>
        )}

        {preview.type === 'write' && preview.oldContent === undefined && preview.newContent && (
          <pre style={{
            margin: 0,
            padding: 12,
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--c-green)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--f-mono)',
          }}>
            {preview.newContent.slice(0, 5000)}
          </pre>
        )}
      </div>
    </div>
  )
}
