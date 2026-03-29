"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useConversations } from "@/hooks/useConversations"
import { ConversationItem } from "./ConversationItem"

interface Props {
  onNavigate?: () => void
}

export function ConversationList({ onNavigate }: Props) {
  const [archived, setArchived] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20
  const { data, isLoading } = useConversations(archived, limit, offset)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {archived ? "Archived" : "Conversations"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1 text-xs text-muted-foreground"
          onClick={() => { setArchived(a => !a); setOffset(0) }}
        >
          {archived ? "Active" : "Archived"}
        </Button>
      </div>

      {isLoading && (
        <p className="px-2 text-xs text-muted-foreground">Loading…</p>
      )}

      {data?.items.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onNavigate={onNavigate}
        />
      ))}

      {data && data.total > offset + limit && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setOffset(o => o + limit)}
        >
          Load more
        </Button>
      )}

      {data?.items.length === 0 && !isLoading && (
        <p className="px-2 text-xs text-muted-foreground">
          {archived ? "No archived conversations." : "No conversations yet."}
        </p>
      )}
    </div>
  )
}
