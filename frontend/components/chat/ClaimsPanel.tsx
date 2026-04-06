"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="shrink-0 border-t border-border bg-muted/30"
    >
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-medium text-foreground">
            {claims.length} memor{claims.length === 1 ? "y" : "ies"} extracted
          </span>
        </div>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-2 max-h-36 overflow-y-auto">
              {claims.map(claim => (
                <div key={claim.id} className="flex items-center gap-3 text-sm">
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 capitalize ${
                      claim.type === "semantic"
                        ? "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400"
                        : "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                    }`}
                  >
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
