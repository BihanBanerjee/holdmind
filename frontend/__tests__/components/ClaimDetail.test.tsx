import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ClaimDetail } from "@/components/memories/ClaimDetail"
import type { GraphNode } from "@/hooks/useMemories"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/hooks/useMemories", async importOriginal => {
  const mod = await importOriginal<typeof import("@/hooks/useMemories")>()
  return {
    ...mod,
    useClaimDetail: () => ({
      data: {
        id: "abc-123",
        type: "semantic",
        label: "sky is blue",
        short_id: "sky-is-blue-abc1",
        confidence: 0.9,
        importance: 0.8,
        support_count: 2,
        created_at: 1743500000,
        confidence_history: [],
        supporting_ids: [],
        contradicting_ids: [],
      },
      isLoading: false,
    }),
    useDeleteClaim: () => ({ mutate: vi.fn() }),
  }
})

const nodes: GraphNode[] = [
  { id: "abc-123", type: "semantic", label: "sky is blue", short_id: "sky-is-blue-abc1", confidence: 0.9, importance: 0.8, created_at: 1743500000 },
]

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("ClaimDetail — short_id", () => {
  it("renders the short_id as a copyable tag", () => {
    wrap(<ClaimDetail claimId="abc-123" allNodes={nodes} onSelectNode={() => {}} onClose={() => {}} />)
    expect(screen.getByText("sky-is-blue-abc1")).toBeInTheDocument()
  })
})
