import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export interface GraphNode {
  id: string
  type: string
  label: string
  short_id: string
  confidence: number
  importance: number
  created_at: number
}

export interface GraphLink {
  source: string
  target: string
  relation: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface ClaimDetail {
  id: string
  type: string
  label: string
  short_id: string
  confidence: number
  importance: number
  support_count: number
  created_at: number
  confidence_history: Array<{
    old_confidence: number
    new_confidence: number
    reason: string
    change_type: string
    timestamp: number
  }>
  supporting_ids: string[]
  contradicting_ids: string[]
}

export function useMemoryGraph() {
  return useQuery({
    queryKey: ["memories"],
    queryFn: () => apiFetch<GraphData>("/api/memories"),
    refetchInterval: 30_000,
  })
}

export function useClaimDetail(claimId: string | null) {
  return useQuery({
    queryKey: ["memory", claimId],
    queryFn: () => apiFetch<ClaimDetail>(`/api/memories/${claimId}`),
    enabled: !!claimId,
  })
}

export function usePatchClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      apiFetch<ClaimDetail>(`/api/memories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ label }),
      }),
    onSuccess: (data, { id }) => {
      qc.setQueryData(["memory", id], data)
      qc.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}

export function useDeleteClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/memories/${id}`, { method: "DELETE" }),
    onMutate: (id: string) => {
      qc.setQueryData<GraphData>(["memories"], prev =>
        prev
          ? {
              nodes: prev.nodes.filter(n => n.id !== id),
              links: prev.links.filter(l => l.source !== id && l.target !== id),
            }
          : prev,
      )
    },
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ["memory", id] })
      qc.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}
