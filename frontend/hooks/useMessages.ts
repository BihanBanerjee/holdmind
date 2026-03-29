import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface PaginatedMessages {
  items: Message[]
  total: number
  limit: number
  offset: number
}

export function useMessages(
  conversationId: string,
  limit = 50,
  offset = 0,
  q?: string,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  if (q) params.set("q", q)
  return useQuery({
    queryKey: ["messages", conversationId, { limit, offset, q }],
    queryFn: () =>
      apiFetch<PaginatedMessages>(
        `/api/conversations/${conversationId}/messages?${params}`,
      ),
    enabled: !!conversationId,
  })
}
