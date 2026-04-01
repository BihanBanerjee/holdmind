"use client"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GraphNode } from "@/hooks/useMemories"

interface Props {
  nodes: GraphNode[]
  selectedId: string | null
  onSelectNode: (id: string) => void
}

export function MemoryList({ nodes, selectedId, onSelectNode }: Props) {
  const sorted = [...nodes].sort((a, b) => b.confidence - a.confidence)

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No memories match your filter.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 overflow-y-auto content-start">
      {sorted.map(node => (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelectNode(node.id)}
          className={`text-left rounded-lg border p-3 transition-colors hover:bg-accent ${
            selectedId === node.id ? "border-primary bg-accent" : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium line-clamp-2 flex-1">{node.label}</p>
            <Badge
              variant="secondary"
              className={`shrink-0 text-[10px] ${
                node.type === "semantic"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              }`}
            >
              {node.type}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span>{Math.round(node.confidence * 100)}%</span>
            </div>
            <Progress value={node.confidence * 100} className="h-1" />
          </div>
        </button>
      ))}
    </div>
  )
}
