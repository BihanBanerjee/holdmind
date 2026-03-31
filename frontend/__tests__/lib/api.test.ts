// frontend/__tests__/lib/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Re-import fresh module per test to reset module-level _refreshPromise state.
async function loadApiFetch() {
  const mod = await import("@/lib/api")
  return mod.apiFetch
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns parsed JSON on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ id: "1" }),
      }),
    )
    const apiFetch = await loadApiFetch()
    const result = await apiFetch("/api/test")
    expect(result).toEqual({ id: "1" })
  })

  it("returns undefined on 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 204,
        ok: true,
        json: () => Promise.resolve(null),
      }),
    )
    const apiFetch = await loadApiFetch()
    const result = await apiFetch("/api/test")
    expect(result).toBeUndefined()
  })

  it("throws error with detail field on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 400,
        ok: false,
        json: () => Promise.resolve({ detail: "Bad Request" }),
      }),
    )
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("Bad Request")
  })

  it("throws generic HTTP error when response body has no detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: () => Promise.resolve({}),
      }),
    )
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("HTTP 500")
  })

  it("refreshes token on 401 and retries the original request", async () => {
    localStorage.setItem("hm_token", "old-token")
    const fetchMock = vi
      .fn()
      // First call: original request → 401
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      // Second call: refresh → 200 with new token
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ access_token: "new-token" }),
      })
      // Third call: retry → 200 with data
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ id: "1" }),
      })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    const result = await apiFetch("/api/test")
    expect(result).toEqual({ id: "1" })
    expect(localStorage.getItem("hm_token")).toBe("new-token")
  })

  it("clears localStorage and throws Session expired when refresh fails", async () => {
    localStorage.setItem("hm_token", "old-token")
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("Session expired")
    expect(localStorage.getItem("hm_token")).toBeNull()
  })

  it("does not attempt refresh for /api/auth/refresh itself (avoids infinite loop)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 401,
      ok: false,
      json: () => Promise.resolve({ detail: "Unauthorized" }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/auth/refresh")).rejects.toThrow("Unauthorized")
    // Only one fetch call — no refresh attempt
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
