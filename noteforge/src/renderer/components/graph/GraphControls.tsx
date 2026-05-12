import { useGraphStore } from '../../stores/graph-store'
import { useEditorStore } from '../../stores/editor-store'

export default function GraphControls() {
  const mode = useGraphStore((s) => s.mode)
  const setMode = useGraphStore((s) => s.setMode)
  const hopCount = useGraphStore((s) => s.hopCount)
  const setHopCount = useGraphStore((s) => s.setHopCount)
  const physicsEnabled = useGraphStore((s) => s.physicsEnabled)
  const setPhysics = useGraphStore((s) => s.setPhysics)
  const filterFolder = useGraphStore((s) => s.filterFolder)
  const setFilterFolder = useGraphStore((s) => s.setFilterFolder)
  const isFullscreen = useGraphStore((s) => s.isFullscreen)
  const setFullscreen = useGraphStore((s) => s.setFullscreen)
  const resetZoom = useGraphStore((s) => s.resetZoom)
  const nodes = useGraphStore((s) => s.nodes)
  const setVisible = useGraphStore((s) => s.setVisible)

  const activeTab = useEditorStore((s) => s.activeTab())
  const folders = [...new Set(nodes.map((n) => n.folder).filter(Boolean))].sort()

  const toggleFullscreen = () => {
    setFullscreen(!isFullscreen)
  }

  const handleClose = () => {
    setVisible(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        height: 36,
        background: 'var(--m-bg)',
        borderBottom: '1px solid var(--m-line-soft)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--m-fg-1)', fontWeight: 500 }}>graph</span>

      {/* Mode toggle */}
      <span
        className="m-chip mono"
        style={{ cursor: 'pointer', color: mode === 'global' ? 'var(--m-vein)' : undefined }}
        onClick={() => setMode('global')}
      >
        mode · global
      </span>
      <span
        className="m-chip mono"
        style={{ cursor: 'pointer', color: mode === 'local' ? 'var(--m-vein)' : undefined }}
        onClick={() => setMode('local')}
      >
        mode · local
      </span>

      {/* Hops (local mode only) */}
      {mode === 'local' && (
        <>
          <div style={{ width: 1, height: 14, background: 'var(--m-line-soft)' }} />
          <span className="m-chip mono" style={{ gap: 6 }}>
            depth ·
            <select
              value={hopCount}
              onChange={(e) => setHopCount(Number(e.target.value))}
              style={{
                background: 'none',
                border: 0,
                outline: 0,
                color: 'var(--m-fg-1)',
                fontFamily: 'var(--f-mono)',
                fontSize: 10.5,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </span>
        </>
      )}

      {/* Physics toggle */}
      <div style={{ width: 1, height: 14, background: 'var(--m-line-soft)' }} />
      <span
        className="m-chip mono"
        style={{ cursor: 'pointer', color: physicsEnabled ? 'var(--m-vein)' : undefined }}
        onClick={() => setPhysics(!physicsEnabled)}
      >
        physics · {physicsEnabled ? 'on' : 'off'}
      </span>

      {/* Folder filter */}
      {folders.length > 0 && (
        <>
          <div style={{ width: 1, height: 14, background: 'var(--m-line-soft)' }} />
          <span className="m-chip mono" style={{ gap: 6 }}>
            filter ·
            <select
              value={filterFolder ?? ''}
              onChange={(e) => setFilterFolder(e.target.value || null)}
              style={{
                background: 'none',
                border: 0,
                outline: 0,
                color: 'var(--m-fg-1)',
                fontFamily: 'var(--f-mono)',
                fontSize: 10.5,
                cursor: 'pointer',
                padding: 0,
                maxWidth: 100,
              }}
            >
              <option value="">all</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Actions */}
      <span className="m-chip mono" style={{ cursor: 'pointer' }} onClick={() => resetZoom()}>
        reset
      </span>
      <span className="m-chip mono" style={{ cursor: 'pointer' }} onClick={toggleFullscreen}>
        {isFullscreen ? 'exit' : 'expand'}
      </span>
      <span className="m-chip mono" style={{ cursor: 'pointer' }} onClick={handleClose}>
        close
      </span>

      {/* Node count */}
      {activeTab && (
        <span style={{ fontSize: 10.5, color: 'var(--m-fg-3)', fontFamily: 'var(--f-mono)' }}>
          {nodes.length} nodes
        </span>
      )}
    </div>
  )
}
