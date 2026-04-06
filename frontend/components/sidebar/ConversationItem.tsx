"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Conversation } from "@/hooks/useConversations"
import { usePatchConversation, useDeleteConversation } from "@/hooks/useConversations"

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w`
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

interface Props {
  conversation: Conversation
  onNavigate?: () => void
}

export function ConversationItem({ conversation, onNavigate }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname === `/chat/${conversation.id}`
  const { mutate: patch } = usePatchConversation()
  const { mutate: deleteConv } = useDeleteConversation()
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(conversation.title)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync title when external prop changes (e.g. after successful rename PATCH)
  useEffect(() => {
    if (!renaming) setTitle(conversation.title)
  }, [conversation.title, renaming])

  useEffect(() => {
    if (renaming) inputRef.current?.focus()
  }, [renaming])

  function commitRename() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== conversation.title) {
      patch({ id: conversation.id, title: trimmed })
    } else {
      setTitle(conversation.title)
    }
    setRenaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitRename()
    if (e.key === "Escape") { setTitle(conversation.title); setRenaming(false) }
  }

  function handleClick() {
    if (!renaming) {
      router.push(`/chat/${conversation.id}`)
      onNavigate?.()
    }
  }

  return (
    <>
      <div
        className={`group flex items-center rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent ${isActive ? "bg-accent" : ""}`}
        onClick={handleClick}
      >
        {renaming ? (
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent outline-none border-b border-primary text-sm"
          />
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className="truncate text-sm">{conversation.title}</span>
              {conversation.updated_at && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatRelativeTime(conversation.updated_at)}
                </span>
              )}
            </div>
            {conversation.last_message_preview && (
              <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
                {conversation.last_message_preview}
              </p>
            )}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); setRenaming(true) }}>
              <Pencil className="mr-2 h-3 w-3" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => { e.stopPropagation(); setArchiveOpen(true) }}
            >
              {conversation.archived ? (
                <><ArchiveRestore className="mr-2 h-3 w-3" /> Unarchive</>
              ) : (
                <><Archive className="mr-2 h-3 w-3" /> Archive</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => { e.stopPropagation(); setDeleteOpen(true) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {conversation.archived ? "Unarchive conversation?" : "Archive conversation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conversation.archived
                ? "This will restore the conversation to your active list."
                : "This will move the conversation to your archive."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => patch(
                { id: conversation.id, archived: !conversation.archived },
                { onSuccess: () => { if (isActive && !conversation.archived) router.push("/chat") } },
              )}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and all its messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConv(
                conversation.id,
                {
                  onSuccess: () => { setDeleteOpen(false); if (isActive) router.push("/chat") },
                  onError: () => setDeleteOpen(false),
                },
              )}
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
