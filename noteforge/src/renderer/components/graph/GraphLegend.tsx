import { hashToColor } from './GraphTooltip'

interface GraphLegendProps {
  folders: string[]
  colors?: Record<string, string>
}

export default function GraphLegend({ folders, colors }: GraphLegendProps) {
  if (folders.length === 0) return null

  const uniqueFolders = [...new Set(folders.filter(Boolean))].slice(0, 20)

  return (
    <div className="graph-legend">
      {uniqueFolders.map((folder) => (
        <div key={folder} className="graph-legend-item">
          <span
            className="graph-legend-dot"
            style={{
              background: colors?.[folder] ?? hashToColor(folder),
            }}
          />
          <span>{folder}</span>
        </div>
      ))}
      {uniqueFolders.length > 20 && (
        <span className="graph-legend-item" style={{ opacity: 0.5 }}>
          +{folders.length - 20} more
        </span>
      )}
    </div>
  )
}
