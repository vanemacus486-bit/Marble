import { useEffect, useRef, useState } from 'react'
import { Brain } from 'lucide-react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { drag } from 'd3-drag'
import { useGraphStore, type GraphNode, type GraphEdge } from '../../stores/graph-store'
import { useGraphData } from '../../hooks/useGraphData'
import { useEditorStore } from '../../stores/editor-store'
import GraphTooltip from './GraphTooltip'
import { hashToColor } from './GraphTooltip'

type D3Node = SimulationNodeDatum & GraphNode
type D3Link = SimulationLinkDatum<D3Node> & { weight: number }

export default function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [tooltip, setTooltip] = useState<{
    node: GraphNode
    position: { x: number; y: number }
  } | null>(null)

  const { filteredGraph } = useGraphData()
  const openNote = useEditorStore((s) => s.openNote)
  const physicsEnabled = useGraphStore((s) => s.physicsEnabled)
  const zoomResetCount = useGraphStore((s) => s.zoomResetCount)

  const { nodes: srcNodes, edges: srcEdges } = filteredGraph

  // Reset zoom when zoomResetCount changes
  useEffect(() => {
    if (zoomRef.current && svgRef.current) {
      const svg = select(svgRef.current)
      svg.transition().duration(500).call(zoomRef.current.transform, zoomIdentity)
    }
  }, [zoomResetCount])

  useEffect(() => {
    if (!svgRef.current || srcNodes.length === 0) return

    const svgEl = svgRef.current
    const svg = select(svgEl)
    const width = svgEl.clientWidth || 600
    const height = svgEl.clientHeight || 400

    // Clear previous render
    svg.selectAll('g.graph-layer').remove()

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-layer')

    // Build D3 copies (D3 mutates these)
    const nodes: D3Node[] = srcNodes.map((n) => ({
      ...n,
      x: n.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: n.y ?? height / 2 + (Math.random() - 0.5) * 200,
    }))

    const edges: D3Link[] = srcEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }))

    // Zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)
    zoomRef.current = zoomBehavior

    // Force simulation
    const simulation = forceSimulation<D3Node>(nodes)
      .force(
        'link',
        forceLink<D3Node, D3Link>(edges)
          .id((d) => d.id)
          .distance(120)
          .strength((d) => Math.min(0.5, d.weight * 0.15))
      )
      .force('charge', forceManyBody<D3Node>().strength(-250))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collide',
        forceCollide<D3Node>().radius((d) => computeRadius(d) + 6)
      )

    // Draw edges
    const edgeGroup = g.append('g').attr('class', 'edges')
    const edgeElements = edgeGroup
      .selectAll<SVGLineElement, D3Link>('line')
      .data(edges)
      .join('line')
      .attr('class', 'graph-edge')
      .attr('stroke-width', (d) => Math.max(0.5, d.weight * 0.8))
      .attr('stroke-opacity', (d) => Math.min(0.7, 0.15 + d.weight * 0.12))

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'graph-node')
      .attr('r', (d) => computeRadius(d))
      .attr('fill', (d) => hashToColor(d.folder))
      .attr('stroke', 'var(--color-bg-primary)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        openNote(d.path)
      })
      .on('mouseenter', (event, d) => {
        const rect = svgEl.getBoundingClientRect()
        setTooltip({
          node: { id: d.id, label: d.label, path: d.path, backlinkCount: d.backlinkCount, folder: d.folder },
          position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        })
      })
      .on('mouseleave', () => {
        setTooltip(null)
      })

    // Drag behavior
    const dragBehavior = drag<SVGCircleElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodeElements.call(dragBehavior)

    // Simulation tick
    simulation.on('tick', () => {
      edgeElements
        .attr('x1', (d) => (d.source as D3Node).x)
        .attr('y1', (d) => (d.source as D3Node).y)
        .attr('x2', (d) => (d.target as D3Node).x)
        .attr('y2', (d) => (d.target as D3Node).y)

      nodeElements.attr('cx', (d) => d.x).attr('cy', (d) => d.y)
    })

    // Physics toggle
    if (!physicsEnabled) {
      simulation.stop()
    }

    // Cleanup
    return () => {
      simulation.stop()
      svg.on('.zoom', null)
      svg.on('.drag', null)
    }
    // Intentionally react to filteredGraph changes (serialized dependency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcNodes, srcEdges, physicsEnabled, openNote])

  if (srcNodes.length === 0) {
    return (
      <div className="graph-empty">
        <Brain className="graph-empty-icon h-12 w-12" />
        <div className="graph-empty-text">No notes to display</div>
      </div>
    )
  }

  return (
    <div className="graph-canvas" style={{ position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%" />
      <GraphTooltip node={tooltip?.node ?? null} position={tooltip?.position ?? { x: 0, y: 0 }} />
    </div>
  )
}

function computeRadius(d: { backlinkCount: number }): number {
  return Math.max(6, Math.min(30, d.backlinkCount * 2 + 6))
}
