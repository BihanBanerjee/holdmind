import { describe, it, expect } from "vitest"
import { getDateBucket, groupConversations } from "@/lib/groupConversations"
import type { Conversation } from "@/hooks/useConversations"

function makeConv(id: string, created_at: string): Conversation {
  return { id, title: "Test", archived: false, created_at }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe("getDateBucket", () => {
  it("returns Today for current time", () => {
    expect(getDateBucket(new Date().toISOString())).toBe("Today")
  })

  it("returns Yesterday for 1 day ago", () => {
    expect(getDateBucket(daysAgo(1))).toBe("Yesterday")
  })

  it("returns Previous 7 days for 3 days ago", () => {
    expect(getDateBucket(daysAgo(3))).toBe("Previous 7 days")
  })

  it("returns Previous 7 days for exactly 7 days ago", () => {
    expect(getDateBucket(daysAgo(7))).toBe("Previous 7 days")
  })

  it("returns Older for 8 days ago", () => {
    expect(getDateBucket(daysAgo(8))).toBe("Older")
  })
})

describe("groupConversations", () => {
  it("groups conversations into correct labeled buckets", () => {
    const convs = [
      makeConv("1", daysAgo(0)),
      makeConv("2", daysAgo(1)),
      makeConv("3", daysAgo(3)),
      makeConv("4", daysAgo(10)),
    ]
    const groups = groupConversations(convs)
    expect(groups).toHaveLength(4)
    expect(groups[0]).toMatchObject({ label: "Today", items: [{ id: "1" }] })
    expect(groups[1]).toMatchObject({ label: "Yesterday", items: [{ id: "2" }] })
    expect(groups[2]).toMatchObject({ label: "Previous 7 days", items: [{ id: "3" }] })
    expect(groups[3]).toMatchObject({ label: "Older", items: [{ id: "4" }] })
  })

  it("omits empty buckets", () => {
    const groups = groupConversations([makeConv("1", daysAgo(0))])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe("Today")
  })

  it("returns empty array for no conversations", () => {
    expect(groupConversations([])).toHaveLength(0)
  })

  it("preserves order within a bucket", () => {
    const convs = [makeConv("a", daysAgo(0)), makeConv("b", daysAgo(0))]
    const groups = groupConversations(convs)
    expect(groups[0].items.map(c => c.id)).toEqual(["a", "b"])
  })
})
