// frontend/__tests__/hooks/useConversations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, waitFor } from "@testing-library/react"
import {
  useConversations,
  useCreateConversation,
  usePatchConversation,
  useDeleteConversation,
} from "@/hooks/useConversations"
import { apiFetch } from "@/lib/api"
import { renderHookWithQuery, makeQueryClient } from "../utils"

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }))

const mockApiFetch = vi.mocked(apiFetch)

const PAGE = { items: [], total: 0, limit: 20, offset: 0 }

beforeEach(() => mockApiFetch.mockReset())

describe("useConversations", () => {
  it("calls apiFetch with limit, offset, and archived params", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE)
    const { result } = renderHookWithQuery(() => useConversations())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain("limit=20")
    expect(url).toContain("offset=0")
    expect(url).toContain("archived=false")
  })

  it("includes q param when search query is non-empty", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE)
    const { result } = renderHookWithQuery(() =>
      useConversations(false, 20, 0, "hello"),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain("q=hello")
  })

  it("omits q param when search query is empty", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE)
    const { result } = renderHookWithQuery(() =>
      useConversations(false, 20, 0, ""),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).not.toContain("q=")
  })
})

describe("useCreateConversation", () => {
  it("calls POST /api/conversations with JSON body", async () => {
    const created = {
      id: "c1",
      title: "Test",
      archived: false,
      created_at: "2024-01-01",
    }
    mockApiFetch.mockResolvedValueOnce(created)
    const { result } = renderHookWithQuery(() => useCreateConversation())
    act(() => result.current.mutate("Test"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/conversations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Test" }),
      }),
    )
  })

  it("invalidates the conversations cache on success", async () => {
    mockApiFetch.mockResolvedValueOnce({
      id: "c1",
      title: "T",
      archived: false,
      created_at: "2024-01-01",
    })
    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHookWithQuery(() => useCreateConversation(), qc)
    act(() => result.current.mutate("T"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] })
  })
})

describe("usePatchConversation", () => {
  it("calls PATCH /api/conversations/{id} with the patch body", async () => {
    mockApiFetch.mockResolvedValueOnce({
      id: "c1",
      title: "Updated",
      archived: false,
      created_at: "2024-01-01",
    })
    const { result } = renderHookWithQuery(() => usePatchConversation())
    act(() => result.current.mutate({ id: "c1", title: "Updated" }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/conversations/c1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
    )
  })
})

describe("useDeleteConversation", () => {
  it("calls DELETE /api/conversations/{id}", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined)
    const { result } = renderHookWithQuery(() => useDeleteConversation())
    act(() => result.current.mutate("c1"))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiFetch).toHaveBeenCalledWith("/api/conversations/c1", {
      method: "DELETE",
    })
  })
})
