"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useMessages, type Message } from "@/hooks/useMessages"
import { MessageBubble } from "./MessageBubble"
import { ThinkingBubble } from "./ThinkingBubble"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  conversationId: string
  streamingContent: string
  pendingUserMessage?: string | null
  searchQuery?: string
  onRegenerate?: (lastUserMessage: string) => void
}

export function MessageList({ conversationId, streamingContent, pendingUserMessage, searchQuery, onRegenerate }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const limit = 50
  // null = not yet initialized (waiting for first fetch to compute starting offset)
  const [lowestOffset, setLowestOffset] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const initialMessageCountRef = useRef<number | null>(null)

  // Reset when conversation or search changes
  useEffect(() => {
    setLowestOffset(null)
    setMessages([])
    initialMessageCountRef.current = null
  }, [conversationId, searchQuery])

  // Use null offset for the initial probe fetch (offset=0 to get total)
  const fetchOffset = lowestOffset ?? 0
  const { data, isLoading } = useMessages(conversationId, limit, fetchOffset, searchQuery)

  useEffect(() => {
    if (!data) return

    if (lowestOffset === null) {
      // First fetch: compute starting offset to show latest messages
      const startOffset = Math.max(0, data.total - limit)
      if (startOffset === 0) {
        // All messages fit in one page — just show them
        setMessages(data.items)
        setLowestOffset(0)
        if (initialMessageCountRef.current === null) {
          initialMessageCountRef.current = data.items.length
        }
      } else {
        // Jump to the latest page (will trigger another fetch)
        setLowestOffset(startOffset)
      }
    } else {
      // Subsequent fetches (load earlier OR refresh after streaming)
      // Prepend new items if this is a "load earlier" page
      setMessages(prev => {
        // Avoid duplicates: if first item already exists, replace instead of prepend
        if (prev.length > 0 && data.items.some(m => m.id === prev[0].id)) {
          return data.items
        }
        // If all current messages are already in data.items, replace (stream invalidation)
        if (prev.length > 0 && data.items.some(m => m.id === prev[prev.length - 1].id)) {
          return [...prev.filter(m => !data.items.find(d => d.id === m.id)), ...data.items]
        }
        const isLoadEarlier = fetchOffset < (lowestOffset ?? 0)
        if (isLoadEarlier) {
          if (initialMessageCountRef.current !== null) {
            initialMessageCountRef.current += data.items.length
          }
          return [...data.items, ...prev]
        }
        if (initialMessageCountRef.current === null) {
          initialMessageCountRef.current = data.items.length
        }
        return data.items
      })
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new content (not during search)
  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingContent, pendingUserMessage, searchQuery])

  const canLoadEarlier = lowestOffset !== null && lowestOffset > 0
  const isThinking = !!pendingUserMessage && !streamingContent
  const initialCount = initialMessageCountRef.current ?? messages.length

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {canLoadEarlier && (
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setLowestOffset(prev => Math.max(0, (prev ?? 0) - limit))}
          >
            Load earlier messages
          </Button>
        </div>
      )}

      {isLoading && messages.length === 0 && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
          <Skeleton className="h-10 w-1/2 rounded-2xl ml-auto" />
          <Skeleton className="h-14 w-2/3 rounded-2xl" />
        </div>
      )}

      {(() => {
        const lastAssistantIdx = messages.reduce(
          (last, msg, i) => (msg.role === "assistant" ? i : last),
          -1,
        )
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content

        return messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            highlight={searchQuery}
            isLast={i === lastAssistantIdx}
            claims={msg.claims ?? undefined}
            animate={i >= initialCount && msg.role === "user"}
            onRegenerate={
              i === lastAssistantIdx && lastUserMsg && onRegenerate
                ? () => onRegenerate(lastUserMsg)
                : undefined
            }
          />
        ))
      })()}

      {pendingUserMessage && (
        <MessageBubble role="user" content={pendingUserMessage} animate />
      )}

      {isThinking && <ThinkingBubble />}

      {streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
