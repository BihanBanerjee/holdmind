"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversations, type Conversation } from "@/hooks/useConversations"
import { ConversationItem } from "./ConversationItem"
import { groupConversations } from "@/lib/groupConversations"

interface Props {
  onNavigate?: () => void
}

export function ConversationList({ onNavigate }: Props) {
  const [archived, setArchived] = useState(false)
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<Conversation[]>([])
  const limit = 20
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
      setOffset(0)
      setAccumulated([])
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const { data, isLoading, isFetching } = useConversations(archived, limit, offset, debouncedQuery)

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
    setQuery("")
    setDebouncedQuery("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
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

      <div className="px-2 pb-1">
        <Input
          value={query}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search conversations…"
          className="h-7 text-xs"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-1 px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {debouncedQuery ? (
        accumulated.map(conv => (
          <ConversationItem key={conv.id} conversation={conv} onNavigate={onNavigate} />
        ))
      ) : (
        groupConversations(accumulated).map(group => (
          <div key={group.label}>
            <p className="px-2 pt-2 pb-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map(conv => (
              <ConversationItem key={conv.id} conversation={conv} onNavigate={onNavigate} />
            ))}
          </div>
        ))
      )}

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
          {debouncedQuery
            ? "No conversations match your search."
            : archived
            ? "No archived conversations."
            : "No conversations yet."}
        </p>
      )}
    </div>
  )
}
