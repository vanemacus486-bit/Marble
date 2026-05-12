import { hashToColor } from './GraphTooltip'

interface GraphLegendProps {
  folders: string[]
  colors?: Record<string, string>
}

export default function GraphLegend({ folders, colors }: GraphLegendProps) {
  if (folders.length === 0) return null

  const uniqueFolders = [...new Set(folders.filter(Boolean))].slice(0, 20)

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '8px 12px',
        borderTop: '1px solid var(--m-line-soft)',
        background: 'var(--m-bg-1)',
      }}
    >
      {uniqueFolders.map((folder) => (
        <span
          key={folder}
          className="m-chip mono"
          style={{ gap: 5, fontSize: 10.5 }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: colors?.[folder] ?? hashToColor(folder),
              flexShrink: 0,
            }}
          />
          {folder}
        </span>
      ))}
      {uniqueFolders.length > 20 && (
        <span className="m-chip mono" style={{ color: 'var(--m-fg-3)' }}>
          +{folders.length - 20} more
        </span>
      )}
    </div>
  )
}
