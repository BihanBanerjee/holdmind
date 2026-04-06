"use client"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GraphNode } from "@/hooks/useMemories"

interface Props {
  nodes: GraphNode[]
  selectedId: string | null
  onSelectNode: (id: string) => void
  contradictedIds?: Set<string>
}

const STALE_DAYS = 60

function isStale(node: GraphNode): boolean {
  return (Date.now() / 1000 - node.created_at) / 86400 > STALE_DAYS
}

export function MemoryList({ nodes, selectedId, onSelectNode, contradictedIds }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No memories match your filter.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 overflow-y-auto content-start">
      {nodes.map(node => {
        const contradicted = contradictedIds?.has(node.id) ?? false
        const stale = isStale(node)
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode(node.id)}
            className={`text-left rounded-lg border p-3 transition-colors hover:bg-accent ${
              selectedId === node.id ? "border-primary bg-accent" : "border-border"
            } ${contradicted || stale ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium line-clamp-2 flex-1">{node.label}</p>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    node.type === "semantic"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}
                >
                  {node.type}
                </Badge>
                {contradicted && (
                  <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 dark:border-red-700 dark:text-red-400">
                    contradicted
                  </Badge>
                )}
                {stale && !contradicted && (
                  <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    stale
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span>{Math.round(node.confidence * 100)}%</span>
              </div>
              <Progress value={node.confidence * 100} className="h-1" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
