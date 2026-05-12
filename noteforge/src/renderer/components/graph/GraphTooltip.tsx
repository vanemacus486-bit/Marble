import type { GraphNode } from '../../stores/graph-store'

interface GraphTooltipProps {
  node: GraphNode | null
  position: { x: number; y: number }
}

export default function GraphTooltip({ node, position }: GraphTooltipProps) {
  if (!node) return null

  const offsetX = Math.min(position.x + 16, window.innerWidth - 270)
  const offsetY = Math.min(position.y - 10, window.innerHeight - 160)

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 100,
        pointerEvents: 'none',
        left: offsetX,
        top: offsetY,
        background: 'var(--m-bg-1)',
        border: '1px solid var(--m-line)',
        borderLeft: '3px solid var(--m-vein)',
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        maxWidth: 260,
        fontSize: 12.5,
        lineHeight: 1.4,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          color: 'var(--m-fg)',
          marginBottom: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--f-mono)',
          fontSize: 11.5,
        }}
      >
        {node.label}
      </div>
      {node.folder && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--m-fg-2)',
            fontSize: 10.5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: hashToColor(node.folder),
              flexShrink: 0,
            }}
          />
          <span>{node.folder}</span>
        </div>
      )}
      <div
        style={{
          color: 'var(--m-fg-3)',
          fontSize: 10.5,
          marginTop: 2,
          fontFamily: 'var(--f-mono)',
        }}
      >
        backlinks: {node.backlinkCount}
      </div>
    </div>
  )
}

export function hashToColor(str: string): string {
  if (!str) return 'var(--m-vein)'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (str.charCodeAt(i) + ((hash << 5) - hash)) | 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 50%)`
}
