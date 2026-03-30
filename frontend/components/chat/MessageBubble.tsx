interface Props {
  role: "user" | "assistant"
  content: string
  highlight?: string
}

export function MessageBubble({ role, content, highlight }: Props) {
  const isUser = role === "user"

  function renderContent() {
    if (!highlight) return content
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = content.split(new RegExp(`(${escaped})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 text-black rounded px-0.5">{part}</mark>
      ) : part
    )
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  )
}
