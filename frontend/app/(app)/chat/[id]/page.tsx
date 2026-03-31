"use client"
import { use } from "react"
import { useState } from "react"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { ClaimsPanel } from "@/components/chat/ClaimsPanel"
import { MessageSearch } from "@/components/chat/MessageSearch"
import { useChat } from "@/hooks/useChat"

interface Props {
  params: Promise<{ id: string }>
}

export default function ChatPage({ params }: Props) {
  const { id } = use(params)
  const { send, isStreaming, streamingContent, claims, pendingUserMessage } = useChat(id)
  const [searchQuery, setSearchQuery] = useState<string | undefined>()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-sm font-medium text-muted-foreground">Chat</span>
        <MessageSearch onSearch={setSearchQuery} />
      </div>
      <MessageList
        conversationId={id}
        streamingContent={isStreaming ? streamingContent : ""}
        pendingUserMessage={pendingUserMessage}
        searchQuery={searchQuery}
        onRegenerate={isStreaming ? undefined : send}
      />
      <ClaimsPanel claims={claims} />
      <ChatInput onSend={send} disabled={isStreaming} />
    </div>
  )
}
