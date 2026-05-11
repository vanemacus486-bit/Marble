import { create } from 'zustand'

export interface GraphNode {
  id: string
  label: string
  path: string
  backlinkCount: number
  folder: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  isVisible: boolean
  isFullscreen: boolean
  physicsEnabled: boolean
  filterFolder: string | null
  filterTag: string | null
  centerNodeId: string | null
  mode: 'global' | 'local'
  hopCount: number
  zoomResetCount: number

  setGraphData: (nodes: GraphNode[], edges: GraphEdge[]) => void
  resetZoom: () => void
  setVisible: (visible: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
  setPhysics: (enabled: boolean) => void
  setFilterFolder: (folder: string | null) => void
  setFilterTag: (tag: string | null) => void
  setCenterNode: (nodeId: string | null) => void
  setMode: (mode: 'global' | 'local') => void
  setHopCount: (hops: number) => void
  updateNodePosition: (id: string, x: number, y: number) => void
  pinNode: (id: string, pinned: boolean) => void
  getFilteredGraph: () => { nodes: GraphNode[]; edges: GraphEdge[] }
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  isVisible: false,
  isFullscreen: false,
  physicsEnabled: true,
  filterFolder: null,
  filterTag: null,
  centerNodeId: null,
  mode: 'global',
  hopCount: 2,
  zoomResetCount: 0,

  setGraphData: (nodes, edges) => set({ nodes, edges }),
  resetZoom: () => set((s) => ({ zoomResetCount: s.zoomResetCount + 1 })),
  setVisible: (visible) => set({ isVisible: visible }),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setPhysics: (enabled) => set({ physicsEnabled: enabled }),
  setFilterFolder: (folder) => set({ filterFolder: folder }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setCenterNode: (nodeId) => set({ centerNodeId: nodeId }),
  setMode: (mode) => set({ mode }),
  setHopCount: (hops) => set({ hopCount: hops }),

  updateNodePosition: (id, x, y) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }))
  },

  pinNode: (id, pinned) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, fx: pinned ? n.x ?? null : null, fy: pinned ? n.y ?? null : null } : n
      ),
    }))
  },

  getFilteredGraph: () => {
    const { nodes, edges, filterFolder, filterTag, mode, centerNodeId, hopCount } = get()
    let filteredNodes = nodes
    let filteredEdges = edges

    if (mode === 'local' && centerNodeId) {
      const reachable = new Set<string>([centerNodeId])
      let frontier = new Set<string>([centerNodeId])
      for (let hop = 0; hop < hopCount; hop++) {
        const next = new Set<string>()
        for (const edge of edges) {
          if (frontier.has(edge.source) && !reachable.has(edge.target)) {
            reachable.add(edge.target)
            next.add(edge.target)
          }
          if (frontier.has(edge.target) && !reachable.has(edge.source)) {
            reachable.add(edge.source)
            next.add(edge.source)
          }
        }
        frontier = next
      }
      filteredNodes = nodes.filter((n) => reachable.has(n.id))
      filteredEdges = edges.filter(
        (e) => reachable.has(e.source) && reachable.has(e.target)
      )
    }

    if (filterFolder) {
      const folderNodes = new Set(filteredNodes.filter((n) => n.folder.startsWith(filterFolder)).map((n) => n.id))
      filteredNodes = filteredNodes.filter((n) => folderNodes.has(n.id))
      filteredEdges = filteredEdges.filter((e) => folderNodes.has(e.source) && folderNodes.has(e.target))
    }

    return { nodes: filteredNodes, edges: filteredEdges }
  },
}))
