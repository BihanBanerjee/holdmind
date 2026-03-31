// frontend/__tests__/lib/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Re-import fresh module per test to reset module-level _refreshPromise state.
async function loadApiFetch() {
  const mod = await import("@/lib/api")
  return mod.apiFetch
}

describe("apiFetch", () => {
  // IMPORTANT: in each test, call vi.stubGlobal("fetch", ...) BEFORE loadApiFetch().
  // The dynamic import resolves against the global fetch, so the stub must exist first.

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns parsed JSON on 200", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ id: "1" }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    const result = await apiFetch("/api/test")
    expect(result).toEqual({ id: "1" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns undefined on 204", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 204,
      ok: true,
      json: () => Promise.resolve(null),
    })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    const result = await apiFetch("/api/test")
    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("throws error with detail field on non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 400,
      ok: false,
      json: () => Promise.resolve({ detail: "Bad Request" }),
    })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("Bad Request")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("throws generic HTTP error when response body has no detail", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("HTTP 500")
    expect(fetchMock).toHaveBeenCalledTimes(1)
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
    // Stub window.location so jsdom doesn't throw on href assignment
    const location = { href: "" }
    vi.stubGlobal("location", location)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
    vi.stubGlobal("fetch", fetchMock)
    const apiFetch = await loadApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("Session expired")
    expect(localStorage.getItem("hm_token")).toBeNull()
    expect(location.href).toBe("/login")
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
