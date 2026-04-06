"use client"
import { useState, useCallback, useMemo, useEffect } from "react"
import { Network, LayoutList } from "lucide-react"
import { useMemoryGraph } from "@/hooks/useMemories"
import { BeliefGraph } from "@/components/memories/BeliefGraph"
import { MemoryList } from "@/components/memories/MemoryList"
import { ClaimDetail } from "@/components/memories/ClaimDetail"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { filterMemories, type TypeFilter } from "@/lib/filterMemories"

type ViewMode = "graph" | "list"
type SortKey = "confidence" | "importance" | "newest" | "oldest"

const SORT_LABELS: Record<SortKey, string> = {
  confidence: "Confidence",
  importance: "Importance",
  newest: "Newest",
  oldest: "Oldest",
}

export default function MemoriesPage() {
  const { data, isLoading } = useMemoryGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("graph")
  const [sortKey, setSortKey] = useState<SortKey>("confidence")
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

  const sortedNodes = useMemo(() => {
    if (!filteredData) return []
    return [...filteredData.nodes].sort((a, b) => {
      if (sortKey === "confidence") return b.confidence - a.confidence
      if (sortKey === "importance") return b.importance - a.importance
      if (sortKey === "newest") return b.created_at - a.created_at
      return a.created_at - b.created_at // oldest
    })
  }, [filteredData, sortKey])

  const contradictedIds = useMemo(() => {
    if (!data) return new Set<string>()
    return new Set(
      data.links.filter(l => l.relation === "contradicts").map(l => l.target as string)
    )
  }, [data])

  useEffect(() => {
    if (selectedId && filteredData && !filteredData.nodes.some(n => n.id === selectedId)) {
      setSelectedId(null)
    }
  }, [filteredData, selectedId])

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
        {/* Search + filter + view toggle toolbar */}
        <div className="flex flex-col gap-1.5 px-4 py-2 border-b border-border shrink-0">
          {/* Row 1: search + view toggles */}
          <div className="flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search memories…"
              className="h-8 flex-1 text-sm"
            />
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("graph")}
                aria-label="Graph view"
                aria-pressed={viewMode === "graph"}
                className={`p-2 rounded transition-colors ${
                  viewMode === "graph"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Network className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Row 2: filter pills + count + sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {(["all", "semantic", "episodic"] as TypeFilter[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTypeFilter(f)}
                  aria-pressed={typeFilter === f}
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
            {viewMode === "list" && (
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="ml-auto text-xs text-muted-foreground bg-transparent border border-border rounded px-2 py-1 cursor-pointer"
                aria-label="Sort by"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === "list" ? (
            <MemoryList
              nodes={sortedNodes}
              selectedId={selectedId}
              onSelectNode={handleSelectNode}
              contradictedIds={contradictedIds}
            />
          ) : filteredData && filteredData.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No memories match your filter.
            </div>
          ) : (
            <>
              <BeliefGraph
                data={filteredData!}
                selectedId={selectedId}
                onSelectNode={handleSelectNode}
              />
              <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-3 py-2">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Semantic</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Episodic</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-green-500" /> Supports</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-red-500" /> Contradicts</span>
              </div>
            </>
          )}
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
