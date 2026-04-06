"use client"
import { useState, useEffect, useRef } from "react"
import { X, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useClaimDetail, useDeleteClaim, usePatchClaim } from "@/hooks/useMemories"
import type { GraphNode } from "@/hooks/useMemories"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  claimId: string
  allNodes: GraphNode[]
  onSelectNode: (id: string) => void
  onClose: () => void
}

export function ClaimDetail({ claimId, allNodes, onSelectNode, onClose }: Props) {
  const { data, isLoading } = useClaimDetail(claimId)
  const { mutate: deleteClaim } = useDeleteClaim()
  const { mutate: patchClaim, isPending: isSaving } = usePatchClaim()
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data) setEditLabel(data.label)
    setEditing(false)
  }, [claimId, data])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitEdit() {
    const trimmed = editLabel.trim()
    if (!trimmed || trimmed === data?.label) { setEditing(false); return }
    patchClaim(
      { id: claimId, label: trimmed },
      {
        onSuccess: () => { setEditing(false); toast.success("Memory updated") },
        onError: () => toast.error("Failed to update memory"),
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit()
    if (e.key === "Escape") { setEditLabel(data?.label ?? ""); setEditing(false) }
  }

  function labelFor(id: string) {
    return allNodes.find(n => n.id === id)?.label ?? id.slice(0, 8)
  }

  return (
    <div className="fixed inset-0 z-20 bg-background flex flex-col md:relative md:inset-auto md:z-auto md:w-80 md:shrink-0 md:border-l md:border-border md:h-full md:overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="font-medium text-sm">Claim Detail</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && (
        <div className="p-4 flex flex-col gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full mt-2" />
          <Skeleton className="h-2 w-full" />
        </div>
      )}

      {data && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <Badge className="mb-2 capitalize">{data.type}</Badge>
            <div className="flex items-start gap-1 group/label">
              {editing ? (
                <>
                  <input
                    ref={inputRef}
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className="flex-1 text-sm font-medium leading-snug bg-transparent border-b border-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={commitEdit}
                    disabled={isSaving}
                    className="shrink-0 p-0.5 text-primary"
                    aria-label="Save label"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-medium leading-snug">{data.label}</p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="shrink-0 p-0.5 text-muted-foreground opacity-100 md:opacity-0 md:group-hover/label:opacity-100 transition-opacity"
                    aria-label="Edit label"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(data.short_id)
                  .then(() => toast.success("Copied"))
                  .catch(() => toast.error("Copy failed"))
              }
              title="Copy ID"
              className="mt-1 font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors cursor-copy"
            >
              {data.short_id}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Confidence</span>
                <span>{Math.round(data.confidence * 100)}%</span>
              </div>
              <Progress value={data.confidence * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Importance</span>
                <span>{Math.round(data.importance * 100)}%</span>
              </div>
              <Progress value={data.importance * 100} className="h-2" />
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex flex-col gap-1">
            <span>Support count: {data.support_count}</span>
            <span>Created: {new Date(data.created_at * 1000).toLocaleString()}</span>
          </div>

          {data.confidence_history.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Confidence history
              </p>
              <div className="flex flex-col gap-2">
                {data.confidence_history.map((e, i) => (
                  <div key={i} className="text-xs bg-muted rounded-md p-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted-foreground">
                        {Math.round(e.old_confidence * 100)}% → {Math.round(e.new_confidence * 100)}%
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(e.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-foreground">{e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.supporting_ids.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-600 mb-2 uppercase tracking-wider">
                Supported by
              </p>
              <div className="flex flex-wrap gap-1">
                {data.supporting_ids.map(id => (
                  <button
                    key={id}
                    onClick={() => onSelectNode(id)}
                    className="text-xs bg-green-500/10 text-green-600 rounded px-2 py-0.5 hover:bg-green-500/20"
                  >
                    {labelFor(id)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.contradicting_ids.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-2 uppercase tracking-wider">
                Contradicted by
              </p>
              <div className="flex flex-wrap gap-1">
                {data.contradicting_ids.map(id => (
                  <button
                    key={id}
                    onClick={() => onSelectNode(id)}
                    className="text-xs bg-red-500/10 text-red-600 rounded px-2 py-0.5 hover:bg-red-500/20"
                  >
                    {labelFor(id)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  Delete memory
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the belief from your graph permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteClaim(claimId, {
                        onSuccess: () => onClose(),
                        onError: () => toast.error("Failed to delete memory"),
                      })
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}
