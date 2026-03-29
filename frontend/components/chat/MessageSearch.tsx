"use client"
import { useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSearch: (q: string | undefined) => void
}

export function MessageSearch({ onSearch }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    onSearch(q.trim() || undefined)
  }

  function handleClose() {
    setOpen(false)
    setQuery("")
    onSearch(undefined)
  }

  if (!open) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={query}
        onChange={handleChange}
        placeholder="Search messages…"
        className="h-7 w-48 text-sm"
      />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
