"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useConversations, type Conversation } from "@/hooks/useConversations"
import { ConversationItem } from "./ConversationItem"

interface Props {
  onNavigate?: () => void
}

export function ConversationList({ onNavigate }: Props) {
  const [archived, setArchived] = useState(false)
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<Conversation[]>([])
  const limit = 20
  const { data, isLoading, isFetching } = useConversations(archived, limit, offset)

  // Append new page results to accumulated list
  useEffect(() => {
    if (!data) return
    if (offset === 0) {
      setAccumulated(data.items)
    } else {
      setAccumulated(prev => [...prev, ...data.items])
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleArchived() {
    setArchived(a => !a)
    setOffset(0)
    setAccumulated([])
  }

  const hasMore = data ? data.total > offset + limit : false

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
          onClick={toggleArchived}
        >
          {archived ? "Active" : "Archived"}
        </Button>
      </div>

      {isLoading && (
        <p className="px-2 text-xs text-muted-foreground">Loading…</p>
      )}

      {accumulated.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onNavigate={onNavigate}
        />
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setOffset(o => o + limit)}
          disabled={isFetching}
        >
          {isFetching ? "Loading…" : "Load more"}
        </Button>
      )}

      {accumulated.length === 0 && !isLoading && (
        <p className="px-2 text-xs text-muted-foreground">
          {archived ? "No archived conversations." : "No conversations yet."}
        </p>
      )}
    </div>
  )
}
