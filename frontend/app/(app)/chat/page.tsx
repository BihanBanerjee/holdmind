"use client"
import { useRouter } from "next/navigation"
import { useConversations, useCreateConversation } from "@/hooks/useConversations"

const PROMPTS = [
  "Tell me about yourself",
  "What do you remember about me?",
  "I just started a new job",
  "Help me think through something",
]

export default function ChatIndexPage() {
  const router = useRouter()
  const { data, isLoading } = useConversations()
  const { mutateAsync: createConversation } = useCreateConversation()

  async function handlePrompt(prompt: string) {
    const conv = await createConversation(prompt.slice(0, 40))
    router.push(`/chat/${conv.id}?prompt=${encodeURIComponent(prompt).replace(/%20/g, "+")}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Holdmind</h1>
        <p className="mt-1 text-muted-foreground">What&apos;s on your mind?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePrompt(prompt)}
            className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
