"use client"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface Claim {
  id: string
  type: string
  text: string
  confidence: number
}

export function useChat(conversationId: string) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [claims, setClaims] = useState<Claim[]>([])
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null)
  const qc = useQueryClient()

  const send = useCallback(
    async (message: string) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("hm_token") : null
      setPendingUserMessage(message)
      setIsStreaming(true)
      setStreamingContent("")
      setClaims([])

      try {
        const res = await fetch(
          `${BASE}/api/conversations/${conversationId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ message }),
          },
        )

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6)
            if (raw === "[DONE]") {
              await Promise.all([
                qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
                qc.invalidateQueries({ queryKey: ["conversations"] }),
              ])
              setPendingUserMessage(null)
              return
            }
            let frame: { type: string; content?: string; data?: unknown; message?: string }
            try {
              frame = JSON.parse(raw)
            } catch {
              continue // malformed JSON — skip this frame
            }
            if (frame.type === "chunk") {
              setStreamingContent(prev => prev + (frame.content as string))
            }
            if (frame.type === "claims") {
              setClaims(frame.data as Claim[])
            }
            if (frame.type === "error") {
              throw new Error(frame.message ?? "Streaming error")
            }
          }
        }
      } finally {
        setIsStreaming(false)
        setPendingUserMessage(null)
      }
    },
    [conversationId, qc],
  )

  return { send, isStreaming, streamingContent, claims, pendingUserMessage }
}
