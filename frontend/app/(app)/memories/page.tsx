"use client"
import { useState, useCallback, useMemo } from "react"
import { useMemoryGraph } from "@/hooks/useMemories"
import { BeliefGraph } from "@/components/memories/BeliefGraph"
import { ClaimDetail } from "@/components/memories/ClaimDetail"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { filterMemories, type TypeFilter } from "@/lib/filterMemories"

export default function MemoriesPage() {
  const { data, isLoading } = useMemoryGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const handleSelectNode = useCallback((id: string) => setSelectedId(id), [])

  const counts = useMemo(() => {
    if (!data) return { all: 0, semantic: 0, episodic: 0 }
    return {
      all: data.nodes.length,
      semantic: data.nodes.filter(n => n.type === "semantic").length,
      episodic: data.nodes.filter(n => n.type === "episodic").length,
    }
  }, [data])

  const filteredData = useMemo(
    () => (data ? filterMemories(data, typeFilter, searchTerm) : null),
    [data, typeFilter, searchTerm],
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading memory graph…
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No memories yet — start chatting to build your belief graph.
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Search + filter toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search memories…"
            className="h-8 max-w-xs text-sm"
          />
          <div className="flex gap-1">
            {(["all", "semantic", "episodic"] as TypeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  typeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {counts[f]}
                </Badge>
              </button>
            ))}
          </div>
          {filteredData && filteredData.nodes.length !== data.nodes.length && (
            <span className="text-xs text-muted-foreground">
              {filteredData.nodes.length} of {data.nodes.length}
            </span>
          )}
        </div>

        {/* Graph */}
        <div className="flex-1 relative">
          {filteredData && filteredData.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No memories match your filter.
            </div>
          ) : (
            <BeliefGraph
              data={filteredData ?? { nodes: [], links: [] }}
              selectedId={selectedId}
              onSelectNode={handleSelectNode}
            />
          )}
          <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-3 py-2">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Semantic</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-purple-500" /> Episodic</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-green-500" /> Supports</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-red-500" /> Contradicts</span>
          </div>
        </div>
      </div>

      {selectedId && (
        <ClaimDetail
          claimId={selectedId}
          allNodes={data.nodes}
          onSelectNode={handleSelectNode}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
