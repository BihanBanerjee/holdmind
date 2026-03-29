"use client"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCreateConversation } from "@/hooks/useConversations"

export function NewChatButton() {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateConversation()

  async function handleClick() {
    const conv = await mutateAsync("New Chat")
    router.push(`/chat/${conv.id}`)
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  )
}
