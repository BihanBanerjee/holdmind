import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export interface Conversation {
  id: string
  title: string
  archived: boolean
  created_at: string
  last_message_preview: string | null
  updated_at: string | null
}

export interface PaginatedConversations {
  items: Conversation[]
  total: number
  limit: number
  offset: number
}

export function useConversations(archived = false, limit = 20, offset = 0, q = "") {
  return useQuery({
    queryKey: ["conversations", { archived, limit, offset, q }],
    queryFn: () => {
      const url = new URL("/api/conversations", "http://n")
      url.searchParams.set("limit", String(limit))
      url.searchParams.set("offset", String(offset))
      url.searchParams.set("archived", String(archived))
      if (q) url.searchParams.set("q", q)
      return apiFetch<PaginatedConversations>(url.pathname + url.search)
    },
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) =>
      apiFetch<Conversation>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  })
}

export function usePatchConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      title?: string
      archived?: boolean
    }) =>
      apiFetch<Conversation>(`/api/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  })
}
