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

function edgeAttrs(weight: number) {
  if (weight >= 3)
    return { stroke: 'var(--m-vein)', dash: null as string | null, opacity: 0.55, width: 1.8 }
  if (weight >= 2)
    return { stroke: 'var(--c-cyan)', dash: '4 3' as string | null, opacity: 0.45, width: 1.3 }
  return { stroke: 'var(--m-fg-3)', dash: null as string | null, opacity: 0.2, width: 0.8 }
}

function computeRadius(d: { backlinkCount: number }): number {
  return Math.max(6, Math.min(24, d.backlinkCount * 2 + 6))
}

export default function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [tooltip, setTooltip] = useState<{
    node: GraphNode
    position: { x: number; y: number }
  } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { filteredGraph } = useGraphData()
  const openNote = useEditorStore((s) => s.openNote)
  const physicsEnabled = useGraphStore((s) => s.physicsEnabled)
  const zoomResetCount = useGraphStore((s) => s.zoomResetCount)
  const { nodes: srcNodes, edges: srcEdges } = filteredGraph

  // Reset zoom when zoomResetCount changes
  useEffect(() => {
    if (zoomRef.current && svgRef.current) {
      select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, zoomIdentity)
    }
  }, [zoomResetCount])

  useEffect(() => {
    if (!svgRef.current || srcNodes.length === 0) return

    const svgEl = svgRef.current
    const svg = select(svgEl)
    const width = svgEl.clientWidth || 600
    const height = svgEl.clientHeight || 400

    // Add SVG defs (arrow markers, glow filter) once
    let defs = svg.select<SVGDefsElement>('defs.graph-defs')
    if (defs.empty()) {
      defs = svg.insert('defs', ':first-child').attr('class', 'graph-defs')
      defs.html(
        `<marker id="arrowGold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--m-vein)" />
        </marker>
        <marker id="arrowCyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--c-cyan)" />
        </marker>
        <filter id="graphGlow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>`,
      )
    }

    // Clear previous render
    svg.selectAll('g.graph-layer').remove()

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-layer')

    // Click background to deselect selected node
    g.on('click', (event) => {
      if (event.target === g.node()) setSelectedId(null)
    })

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
          .strength((d) => Math.min(0.5, d.weight * 0.15)),
      )
      .force('charge', forceManyBody<D3Node>().strength(-250))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<D3Node>().radius((d) => computeRadius(d) + 6))

    // ── Draw Edges ──
    const edgeGroup = g.append('g').attr('class', 'edges')
    const edgeElements = edgeGroup
      .selectAll<SVGLineElement, D3Link>('line')
      .data(edges)
      .join('line')
      .attr('class', 'graph-edge')
      .each(function (d) {
        const el = select(this)
        const ea = edgeAttrs(d.weight)
        const src = (d.source as D3Node).id
        const tgt = (d.target as D3Node).id
        const sel = src === selectedId || tgt === selectedId
        el.attr('stroke', ea.stroke)
          .attr('stroke-width', ea.width)
          .attr('stroke-dasharray', ea.dash)
          .attr('stroke-opacity', sel ? Math.min(1, ea.opacity * 2) : ea.opacity)
        if (ea.stroke === 'var(--m-vein)') el.attr('marker-end', 'url(#arrowGold)')
        else if (ea.stroke === 'var(--c-cyan)') el.attr('marker-end', 'url(#arrowCyan)')
      })

    // ── Draw Nodes ──
    const nodeGroup = g.append('g').attr('class', 'nodes')

    // Selection ring (single element, follows selected node)
    const ringGroup = nodeGroup.append('g').attr('class', 'rings')
    const ringSel = ringGroup
      .append('circle')
      .attr('fill', 'none')
      .attr('stroke', 'var(--m-vein)')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '2 3')
      .attr('opacity', 0)

    const nodeElements = nodeGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'graph-node')
      .attr('r', (d) => computeRadius(d))
      .attr('fill', (d) => hashToColor(d.folder))
      .attr('stroke', (d) => (d.id === selectedId ? 'var(--m-vein)' : 'var(--m-bg)'))
      .attr('stroke-width', (d) => (d.id === selectedId ? 2.5 : 1.5))
      .attr('filter', (d) => (d.id === selectedId ? 'url(#graphGlow)' : null))
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedId(d.id)
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

      // Update selection ring position
      const selNode = selectedId ? nodes.find((n) => n.id === selectedId) : null
      if (selNode) {
        ringSel
          .attr('cx', selNode.x!)
          .attr('cy', selNode.y!)
          .attr('r', computeRadius(selNode) + 6)
          .attr('opacity', 0.6)
      } else {
        ringSel.attr('opacity', 0)
      }
    })

    // Physics toggle
    if (!physicsEnabled) {
      simulation.stop()
    }

    // Cleanup
    return () => {
      simulation.stop()
      svg.on('.zoom', null)
    }
    // Intentionally react to filteredGraph changes (serialized dependency) + selectedId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcNodes, srcEdges, physicsEnabled, openNote, selectedId])

  if (srcNodes.length === 0) {
    return (
      <div
        className="graph-empty"
        style={{
          background: 'var(--m-bg-1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 8,
        }}
      >
        <Brain className="h-12 w-12" style={{ opacity: 0.3, color: 'var(--m-fg-3)' }} />
        <div style={{ color: 'var(--m-fg-3)', fontSize: 13 }}>No notes to display</div>
      </div>
    )
  }

  return (
    <div className="graph-canvas marble-vein-bg" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
      <GraphTooltip node={tooltip?.node ?? null} position={tooltip?.position ?? { x: 0, y: 0 }} />
    </div>
  )
}
