import { useMemo } from 'react'
import { useVaultStore } from '../stores/vault-store'
import { useGraphStore } from '../stores/graph-store'

export function useGraphData() {
  const vaultNotes = useVaultStore((s) => s.notes)
  const setGraphData = useGraphStore((s) => s.setGraphData)
  const graph = useGraphStore()

  useMemo(() => {
    const nodes = Array.from(vaultNotes.values()).map((note) => {
      const folder = note.id.includes('/') ? note.id.substring(0, note.id.lastIndexOf('/')) : ''
      return {
        id: note.id,
        label: note.title,
        path: note.id,
        backlinkCount: note.backlinks.length,
        folder,
      }
    })

    const edgeMap = new Map<string, { source: string; target: string; weight: number }>()
    for (const note of vaultNotes.values()) {
      for (const link of note.links) {
        const key = [link.source, link.target].sort().join('|')
        const existing = edgeMap.get(key)
        if (existing) {
          existing.weight++
        } else {
          edgeMap.set(key, { source: link.source, target: link.target, weight: 1 })
        }
      }
    }

    setGraphData(nodes, Array.from(edgeMap.values()))
  }, [vaultNotes, setGraphData])

  return {
    ...graph,
    filteredGraph: graph.getFilteredGraph(),
  }
}
