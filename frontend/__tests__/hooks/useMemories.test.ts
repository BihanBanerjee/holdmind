// frontend/__tests__/hooks/useMemories.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, waitFor } from "@testing-library/react"
import {
  useMemoryGraph,
  useClaimDetail,
  useDeleteClaim,
} from "@/hooks/useMemories"
import { apiFetch } from "@/lib/api"
import { renderHookWithQuery, makeQueryClient } from "../utils"

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }))

const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => mockApiFetch.mockReset())

describe("useMemoryGraph", () => {
  it("fetches /api/memories", async () => {
    mockApiFetch.mockResolvedValueOnce({ nodes: [], links: [] })
    const { result } = renderHookWithQuery(() => useMemoryGraph())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith("/api/memories")
  })
})

describe("useClaimDetail", () => {
  it("fetches /api/memories/{id} when claimId is set", async () => {
    mockApiFetch.mockResolvedValueOnce({
      id: "m1",
      type: "semantic",
      label: "test",
      confidence: 0.9,
      importance: 0.8,
      support_count: 1,
      created_at: 0,
      confidence_history: [],
      supporting_ids: [],
      contradicting_ids: [],
    })
    const { result } = renderHookWithQuery(() => useClaimDetail("m1"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith("/api/memories/m1")
  })

  it("is disabled (fetchStatus idle) when claimId is null", () => {
    const { result } = renderHookWithQuery(() => useClaimDetail(null))
    expect(result.current.fetchStatus).toBe("idle")
    expect(mockApiFetch).not.toHaveBeenCalled()
  })
})

describe("useDeleteClaim", () => {
  it("calls DELETE /api/memories/{id} and invalidates memories cache", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined)
    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHookWithQuery(() => useDeleteClaim(), qc)
    act(() => result.current.mutate("m1"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith("/api/memories/m1", {
      method: "DELETE",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["memories"] })
  })
})
