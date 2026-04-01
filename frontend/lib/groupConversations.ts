import type { Conversation } from "@/hooks/useConversations"

export type DateBucket = "Today" | "Yesterday" | "Previous 7 days" | "Older"

export function getDateBucket(dateStr: string): DateBucket {
  const date = new Date(dateStr)
  const now = new Date()
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays <= 7) return "Previous 7 days"
  return "Older"
}

const BUCKET_ORDER: DateBucket[] = ["Today", "Yesterday", "Previous 7 days", "Older"]

export function groupConversations(
  conversations: Conversation[],
): Array<{ label: DateBucket; items: Conversation[] }> {
  const groups: Record<DateBucket, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  }
  for (const conv of conversations) {
    groups[getDateBucket(conv.created_at)].push(conv)
  }
  return BUCKET_ORDER.filter(label => groups[label].length > 0).map(label => ({
    label,
    items: groups[label],
  }))
}
