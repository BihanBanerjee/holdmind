"use client"
import { useState, useRef, useEffect } from "react"
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react"

interface Props {
  role: "user" | "assistant"
  content: string
  highlight?: string
  isLast?: boolean
  onRegenerate?: () => void
}

export function MessageBubble({ role, content, highlight, isLast, onRegenerate }: Props) {
  const isUser = role === "user"
  const [copied, setCopied] = useState(false)
  const [thumbUp, setThumbUp] = useState(false)
  const [thumbDown, setThumbDown] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }
  }, [])

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard write failed (e.g. page not focused) — do nothing
    }
  }

  function handleThumbUp() {
    setThumbUp(v => !v)
    setThumbDown(false)
  }

  function handleThumbDown() {
    setThumbDown(v => !v)
    setThumbUp(false)
  }

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {renderContent()}
      </div>

      {!isUser && (
        <div className="flex gap-1 mt-1 px-1">
          <button
            aria-label="Copy"
            onClick={handleCopy}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
          <button
            aria-label="Thumbs up"
            aria-pressed={thumbUp}
            data-active={thumbUp}
            onClick={handleThumbUp}
            className={`p-1 rounded transition-colors ${thumbUp ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button
            aria-label="Thumbs down"
            aria-pressed={thumbDown}
            data-active={thumbDown}
            onClick={handleThumbDown}
            className={`p-1 rounded transition-colors ${thumbDown ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ThumbsDown className="h-3 w-3" />
          </button>
          {isLast && onRegenerate && (
            <button
              aria-label="Regenerate"
              onClick={onRegenerate}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
