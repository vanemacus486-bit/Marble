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
      className="graph-tooltip"
      style={{ left: offsetX, top: offsetY }}
    >
      <div className="graph-tooltip-title">{node.label}</div>
      {node.folder && (
        <div className="graph-tooltip-detail graph-tooltip-folder">
          <span
            className="graph-tooltip-dot"
            style={{
              background: hashToColor(node.folder),
            }}
          />
          <span>{node.folder}</span>
        </div>
      )}
      <div className="graph-tooltip-detail">
        Backlinks: {node.backlinkCount}
      </div>
    </div>
  )
}

export function hashToColor(str: string): string {
  if (!str) return 'var(--color-accent)'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (str.charCodeAt(i) + ((hash << 5) - hash)) | 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 50%)`
}
