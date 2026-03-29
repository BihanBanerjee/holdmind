"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Claim } from "@/hooks/useChat"

interface Props {
  claims: Claim[]
}

export function ClaimsPanel({ claims }: Props) {
  const [open, setOpen] = useState(true)

  if (claims.length === 0) return null

  return (
    <div className="shrink-0 border-t border-border bg-muted/30">
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(o => !o)}
      >
        <span>
          {claims.length} memor{claims.length === 1 ? "y" : "ies"} extracted
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-2 max-h-36 overflow-y-auto">
          {claims.map(claim => (
            <div key={claim.id} className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="text-xs shrink-0 capitalize">
                {claim.type}
              </Badge>
              <span className="flex-1 truncate text-xs">{claim.text}</span>
              <div className="flex items-center gap-1 shrink-0 w-20">
                <Progress value={claim.confidence * 100} className="h-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(claim.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
