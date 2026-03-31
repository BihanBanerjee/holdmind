// frontend/__tests__/hooks/useMessages.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { useMessages } from "@/hooks/useMessages"
import { apiFetch } from "@/lib/api"
import { renderHookWithQuery } from "../utils"

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }))

const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => mockApiFetch.mockReset())

describe("useMessages", () => {
  it("fetches messages for the given conversation", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    })
    const { result } = renderHookWithQuery(() => useMessages("conv1"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain("/api/conversations/conv1/messages")
  })

  it("includes q param when search query is provided", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    })
    const { result } = renderHookWithQuery(() =>
      useMessages("conv1", 50, 0, "hello"),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain("q=hello")
  })

  it("is disabled (fetchStatus idle) when conversationId is empty string", () => {
    const { result } = renderHookWithQuery(() => useMessages(""))
    expect(result.current.fetchStatus).toBe("idle")
    expect(mockApiFetch).not.toHaveBeenCalled()
  })
})
