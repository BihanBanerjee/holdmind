"use client"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import type { GraphData, GraphNode } from "@/hooks/useMemories"

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

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

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setDims({ width: el.clientWidth || 800, height: el.clientHeight || 600 })
    })
    observer.observe(el)
    // Set initial dims
    setDims({ width: el.clientWidth || 800, height: el.clientHeight || 600 })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    const svg = d3.select(el)
    svg.selectAll("*").remove()

    const width = dims.width
    const height = dims.height

    const g = svg.append("g")

    svg.call(
      d3.zoom<SVGSVGElement, unknown>().on("zoom", e => {
        g.attr("transform", e.transform.toString())
      }),
    )

    const nodes: SimNode[] = data.nodes.map(n => ({ ...n }))
    const links = data.links.map(l => ({ ...l }))

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

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: d3.SimulationLinkDatum<SimNode> & { relation: string }) => linkColor(d.relation))
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d: d3.SimulationLinkDatum<SimNode> & { relation: string }) => d.relation === "similar" ? "5,5" : null)
      .attr("stroke-opacity", 0.7)

    const node = (g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle") as d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>)
      .attr("r", d => 6 + d.importance * 12)
      .attr("fill", d => nodeColor(d))
      .attr("opacity", d => 0.4 + d.confidence * 0.6)
      .attr("stroke", d => d.id === selectedId ? "#ffffff" : "none")
      .attr("stroke-width", 2.5)
      .style("cursor", "pointer")
      .on("click", (_e, d) => onSelectNode(d.id))
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

    const label = g
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
        .attr("x1", (d: d3.SimulationLinkDatum<SimNode>) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d: d3.SimulationLinkDatum<SimNode>) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d: d3.SimulationLinkDatum<SimNode>) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d: d3.SimulationLinkDatum<SimNode>) => (d.target as SimNode).y ?? 0)
      node.attr("cx", d => d.x ?? 0).attr("cy", d => d.y ?? 0)
      label.attr("x", d => d.x ?? 0).attr("y", d => d.y ?? 0)
    })

    return () => {
      simulation.stop()
    }
  }, [data, selectedId, onSelectNode, dims])

  return <svg ref={svgRef} className="w-full h-full" />
}
