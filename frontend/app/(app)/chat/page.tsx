"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useConversations } from "@/hooks/useConversations"

export default function ChatIndexPage() {
  const router = useRouter()
  const { data, isLoading } = useConversations()

  useEffect(() => {
    if (!data) return
    if (data.items.length > 0) {
      router.replace(`/chat/${data.items[0].id}`)
    }
  }, [data, router])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>No conversations yet. Click <strong>New Chat</strong> to start.</p>
    </div>
  )
}
