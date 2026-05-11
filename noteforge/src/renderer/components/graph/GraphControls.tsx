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
    <div className="graph-controls">
      {/* Mode toggle */}
      <div className="graph-controls-group">
        <span className="graph-controls-label">Mode</span>
        <button
          className={`graph-controls-btn${mode === 'global' ? ' active' : ''}`}
          onClick={() => setMode('global')}
        >
          Global
        </button>
        <button
          className={`graph-controls-btn${mode === 'local' ? ' active' : ''}`}
          onClick={() => setMode('local')}
        >
          Local
        </button>
      </div>

      {mode === 'local' && (
        <>
          <div className="graph-controls-divider" />
          <div className="graph-controls-group">
            <span className="graph-controls-label">Hops</span>
            <select
              className="graph-controls-select"
              value={hopCount}
              onChange={(e) => setHopCount(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </>
      )}

      <div className="graph-controls-divider" />

      {/* Physics toggle */}
      <div className="graph-controls-group">
        <button
          className={`graph-controls-btn${physicsEnabled ? ' active' : ''}`}
          onClick={() => setPhysics(!physicsEnabled)}
          title="Toggle physics simulation"
        >
          {physicsEnabled ? 'Physics On' : 'Physics Off'}
        </button>
      </div>

      {/* Folder filter */}
      {folders.length > 0 && (
        <>
          <div className="graph-controls-divider" />
          <div className="graph-controls-group">
            <span className="graph-controls-label">Folder</span>
            <select
              className="graph-controls-select"
              value={filterFolder ?? ''}
              onChange={(e) => setFilterFolder(e.target.value || null)}
            >
              <option value="">All</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="graph-controls-divider" />

      {/* Reset and fullscreen */}
      <div className="graph-controls-group">
        <button
          className="graph-controls-btn"
          onClick={() => resetZoom()}
          title="Reset zoom"
        >
          Reset
        </button>
        <button
          className="graph-controls-btn"
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
        <button
          className="graph-controls-btn"
          onClick={handleClose}
          title="Close graph"
        >
          Close
        </button>
      </div>

      {/* Node count */}
      <span className="graph-controls-count">
        {activeTab ? `${nodes.length} nodes` : ''}
      </span>
    </div>
  )
}
