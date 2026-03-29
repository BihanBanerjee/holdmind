"use client"
import { useState, useCallback } from "react"
import { useMemoryGraph } from "@/hooks/useMemories"
import { BeliefGraph } from "@/components/memories/BeliefGraph"
import { ClaimDetail } from "@/components/memories/ClaimDetail"

export default function MemoriesPage() {
  const { data, isLoading } = useMemoryGraph()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const handleSelectNode = useCallback((id: string) => setSelectedId(id), [])

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
      <div className="flex-1 relative">
        <BeliefGraph
          data={data}
          selectedId={selectedId}
          onSelectNode={handleSelectNode}
        />
        <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-3 py-2">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Semantic</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-purple-500" /> Episodic</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-green-500" /> Supports</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-red-500" /> Contradicts</span>
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
