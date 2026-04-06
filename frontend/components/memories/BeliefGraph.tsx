"use client"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import type { GraphData, GraphNode } from "@/hooks/useMemories"

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: string
}

interface Props {
  data: GraphData
  selectedId: string | null
  onSelectNode: (id: string) => void
}

function linkColor(relation: string): string {
  if (relation === "supports") return "#22c55e"
  if (relation === "contradicts") return "#ef4444"
  return "#6b7280"
}

function linkWidth(relation: string): number {
  if (relation === "supports" || relation === "contradicts") return 2.5
  if (relation === "derives") return 2
  return 1.5
}

function nodeColor(node: SimNode): string {
  const baseColor = node.type === "semantic" ? "#3b82f6" : "#a855f7"
  const staleColor = "#94a3b8"
  const nowSec = Date.now() / 1000
  const ageDays = (nowSec - node.created_at) / 86400
  // Fades linearly: vivid at 0 days, fully stale at 60+ days
  const t = Math.min(Math.max(ageDays / 60, 0), 1)
  return d3.interpolateRgb(baseColor, staleColor)(t)
}

export function BeliefGraph({ data, selectedId, onSelectNode }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 600 })

  // Refs to persist D3 selections between selectedId changes
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown> | null>(null)
  const nodesDataRef = useRef<SimNode[]>([])
  const linksDataRef = useRef<SimLink[]>([])
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)
  const onSelectNodeRef = useRef(onSelectNode)

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode
  }, [onSelectNode])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setDims({ width: el.clientWidth || 800, height: el.clientHeight || 600 })
    })
    observer.observe(el)
    setDims({ width: el.clientWidth || 800, height: el.clientHeight || 600 })
    return () => observer.disconnect()
  }, [])

  // Effect 1: rebuild simulation when data or dims change
  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    const svg = d3.select(el)
    svg.selectAll("*").remove()

    const { width, height } = dims
    const g = svg.append("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", e => { g.attr("transform", e.transform.toString()) })

    svg.call(zoom)
    zoomRef.current = zoom

    const nodes: SimNode[] = data.nodes.map(n => ({ ...n }))
    const links: SimLink[] = data.links.map(l => ({ ...l })) as SimLink[]
    nodesDataRef.current = nodes
    linksDataRef.current = links

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: d3.SimulationNodeDatum) => (d as SimNode).id)
          .distance(90),
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(20))

    const link = (g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line") as d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>)
      .attr("stroke", d => linkColor(d.relation))
      .attr("stroke-width", d => linkWidth(d.relation))
      .attr("stroke-dasharray", d => d.relation === "similar" ? "5,5" : null)
      .attr("stroke-opacity", 0.7)

    const node = (g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle") as d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>)
      .attr("r", d => 6 + d.importance * 12)
      .attr("fill", d => nodeColor(d))
      .attr("opacity", d => 0.4 + d.confidence * 0.6)
      .attr("stroke", "none")
      .attr("stroke-width", 2.5)
      .style("cursor", "pointer")
      .on("click", (_e, d) => onSelectNodeRef.current(d.id))
      .on("touchstart", (e: TouchEvent, d) => {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = el.getBoundingClientRect()
        touchTimerRef.current = setTimeout(() => {
          touchTimerRef.current = null
          setTooltip({
            label: d.label,
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top - 48,
          })
        }, 600)
      })
      .on("touchend", () => {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current)
          touchTimerRef.current = null
          return
        }
        hideTimerRef.current = setTimeout(() => setTooltip(null), 1200)
      })
      .on("touchmove", () => {
        if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
        setTooltip(null)
      })
      .on("mouseover", (e: MouseEvent, d) => {
        const rect = el.getBoundingClientRect()
        setTooltip({
          label: d.label,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top - 48,
        })
      })
      .on("mouseout", () => setTooltip(null))
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on("start", (e, d) => {
            if (!e.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (e, d) => {
            d.fx = e.x
            d.fy = e.y
          })
          .on("end", (e, d) => {
            if (!e.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }),
      )

    g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .attr("dy", d => -(6 + d.importance * 12 + 4))
      .style("pointer-events", "none")
      .text(d => d.label.slice(0, 30))

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimNode).x ?? 0)
        .attr("y1", d => (d.source as SimNode).y ?? 0)
        .attr("x2", d => (d.target as SimNode).x ?? 0)
        .attr("y2", d => (d.target as SimNode).y ?? 0)
      node.attr("cx", d => d.x ?? 0).attr("cy", d => d.y ?? 0)
      g.selectAll<SVGTextElement, SimNode>("text")
        .attr("x", d => d.x ?? 0)
        .attr("y", d => d.y ?? 0)
    })

    // Auto-fit the viewport when simulation stabilizes
    simulation.on("end", () => {
      if (nodes.length === 0) return
      const xs = nodes.map(n => n.x ?? 0)
      const ys = nodes.map(n => n.y ?? 0)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const padded = { w: maxX - minX + 80, h: maxY - minY + 80 }
      const scale = Math.min(width / padded.w, height / padded.h, 1) * 0.9
      const tx = (width - scale * (minX + maxX)) / 2
      const ty = (height - scale * (minY + maxY)) / 2
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
    })

    nodeSelRef.current = node
    linkSelRef.current = link

    return () => {
      simulation.stop()
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [data, dims])

  // Effect 2: update highlight when selectedId changes — no simulation restart
  useEffect(() => {
    const node = nodeSelRef.current
    const link = linkSelRef.current
    if (!node || !link) return

    if (!selectedId) {
      node
        .attr("opacity", d => 0.4 + d.confidence * 0.6)
        .attr("stroke", "none")
      link.attr("stroke-opacity", 0.7)
      return
    }

    const connectedIds = new Set<string>([selectedId])
    linksDataRef.current.forEach(l => {
      const srcId = typeof l.source === "object" ? (l.source as SimNode).id : (l.source as string)
      const tgtId = typeof l.target === "object" ? (l.target as SimNode).id : (l.target as string)
      if (srcId === selectedId) connectedIds.add(tgtId)
      if (tgtId === selectedId) connectedIds.add(srcId)
    })

    node
      .attr("opacity", d => connectedIds.has(d.id) ? (0.4 + d.confidence * 0.6) : 0.1)
      .attr("stroke", d => d.id === selectedId ? "#ffffff" : "none")

    link.attr("stroke-opacity", l => {
      const srcId = typeof l.source === "object" ? (l.source as SimNode).id : (l.source as string)
      const tgtId = typeof l.target === "object" ? (l.target as SimNode).id : (l.target as string)
      return srcId === selectedId || tgtId === selectedId ? 0.9 : 0.1
    })
  }, [selectedId])

  function handleZoomIn() {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).call(zoomRef.current.scaleBy, 1.3)
  }
  function handleZoomOut() {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).call(zoomRef.current.scaleBy, 1 / 1.3)
  }
  function handleZoomReset() {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          role="tooltip"
          data-testid="node-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          className="absolute z-10 max-w-[200px] rounded-md bg-popover text-popover-foreground border border-border px-2 py-1 text-xs shadow-md pointer-events-none"
        >
          {tooltip.label}
        </div>
      )}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={handleZoomIn}
          className="p-1.5 rounded bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={handleZoomOut}
          className="p-1.5 rounded bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={handleZoomReset}
          className="p-1.5 rounded bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
