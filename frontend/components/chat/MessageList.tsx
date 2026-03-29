"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useMessages } from "@/hooks/useMessages"
import { MessageBubble } from "./MessageBubble"

interface Props {
  conversationId: string
  streamingContent: string
  searchQuery?: string
}

export function MessageList({ conversationId, streamingContent, searchQuery }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50
  const { data, isLoading } = useMessages(conversationId, limit, offset, searchQuery)

  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [data, streamingContent, searchQuery])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {data && data.total > offset + limit && (
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setOffset(o => o + limit)}
          >
            Load earlier messages
          </Button>
        </div>
      )}

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      )}

      {data?.items.map(msg => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          highlight={searchQuery}
        />
      ))}

      {streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
