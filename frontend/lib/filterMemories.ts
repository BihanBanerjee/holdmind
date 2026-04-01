import type { GraphData } from "@/hooks/useMemories"

export type TypeFilter = "all" | "semantic" | "episodic"

export function filterMemories(
  data: GraphData,
  typeFilter: TypeFilter,
  searchTerm: string,
): GraphData {
  let nodes = data.nodes
  if (typeFilter !== "all") {
    nodes = nodes.filter(n => n.type === typeFilter)
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    nodes = nodes.filter(n => n.label.toLowerCase().includes(term))
  }
  const nodeIds = new Set(nodes.map(n => n.id))
  const links = data.links.filter(
    l => nodeIds.has(l.source) && nodeIds.has(l.target),
  )
  return { nodes, links }
}
