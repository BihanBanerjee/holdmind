// frontend/__tests__/hooks/useChat.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, waitFor } from "@testing-library/react"
import { useChat } from "@/hooks/useChat"
import { renderHookWithQuery, makeQueryClient } from "../utils"

// Build a ReadableStream that yields each line followed by \n
function sseStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + "\n"))
      }
      controller.close()
    },
  })
}

function mockFetch(stream: ReadableStream | null, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, status, body: stream }),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe("useChat — initial state", () => {
  it("exposes isStreaming=false, streamingContent='', claims=[] before any send", () => {
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.streamingContent).toBe("")
    expect(result.current.claims).toEqual([])
  })
})

describe("useChat — chunk frames", () => {
  it("accumulates consecutive chunk frames into streamingContent", async () => {
    mockFetch(
      sseStream([
        'data: {"type":"chunk","content":"Hello"}',
        'data: {"type":"chunk","content":", world"}',
        "data: [DONE]",
      ]),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    expect(result.current.streamingContent).toBe("Hello, world")
  })

  it("resets streamingContent and claims at the start of a new send", async () => {
    // First send: produces content and claims
    const claims = [{ id: "c1", type: "semantic", text: "sky is blue", confidence: 0.9 }]
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          body: sseStream([
            'data: {"type":"chunk","content":"First"}',
            `data: {"type":"claims","data":${JSON.stringify(claims)}}`,
            "data: [DONE]",
          ]),
        })
        // Second send: only [DONE], no new content
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          body: sseStream(["data: [DONE]"]),
        }),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("first")
    })
    expect(result.current.streamingContent).toBe("First")
    expect(result.current.claims).toEqual(claims)

    await act(async () => {
      await result.current.send("second")
    })
    // Cleared at start of second send; no new chunks arrived
    expect(result.current.streamingContent).toBe("")
    expect(result.current.claims).toEqual([])
  })
})

describe("useChat — claims frame", () => {
  it("sets claims from a claims frame", async () => {
    const claimsData = [
      { id: "c1", type: "semantic", text: "sky is blue", confidence: 0.9 },
      { id: "c2", type: "episodic", text: "I had coffee", confidence: 0.7 },
    ]
    mockFetch(
      sseStream([
        `data: {"type":"claims","data":${JSON.stringify(claimsData)}}`,
        "data: [DONE]",
      ]),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    expect(result.current.claims).toEqual(claimsData)
  })
})

describe("useChat — [DONE] frame", () => {
  it("invalidates messages and conversations query caches on [DONE]", async () => {
    mockFetch(sseStream(["data: [DONE]"]))
    const qc = makeQueryClient()
    const invalidate = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHookWithQuery(() => useChat("conv1"), qc)
    await act(async () => {
      await result.current.send("hi")
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["messages", "conv1"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] })
  })

  it("sets isStreaming=false after [DONE]", async () => {
    mockFetch(sseStream(["data: [DONE]"]))
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    expect(result.current.isStreaming).toBe(false)
  })
})

describe("useChat — error handling", () => {
  it("throws on a non-ok HTTP response and resets isStreaming", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, body: null }),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    let caught: Error | undefined
    await act(async () => {
      try {
        await result.current.send("hi")
      } catch (e) {
        caught = e as Error
      }
    })
    expect(caught?.message).toBe("HTTP 500")
    expect(result.current.isStreaming).toBe(false)
  })

  it("throws on an error frame and resets isStreaming", async () => {
    mockFetch(
      sseStream(['data: {"type":"error","message":"Server error"}']),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    let caught: Error | undefined
    await act(async () => {
      try {
        await result.current.send("hi")
      } catch (e) {
        caught = e as Error
      }
    })
    expect(caught?.message).toBe("Server error")
    expect(result.current.isStreaming).toBe(false)
  })

  it("silently skips malformed JSON frames and continues", async () => {
    mockFetch(
      sseStream([
        "data: {not valid json}",
        'data: {"type":"chunk","content":"ok"}',
        "data: [DONE]",
      ]),
    )
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    // Malformed frame skipped; valid chunk still processed
    expect(result.current.streamingContent).toBe("ok")
  })
})

describe("useChat — auth header", () => {
  it("attaches Authorization header when hm_token is in localStorage", async () => {
    localStorage.setItem("hm_token", "tok123")
    mockFetch(sseStream(["data: [DONE]"]))
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("/conv1/chat"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer tok123" }),
      }),
    )
  })

  it("omits Authorization header when no token is stored", async () => {
    mockFetch(sseStream(["data: [DONE]"]))
    const { result } = renderHookWithQuery(() => useChat("conv1"))
    await act(async () => {
      await result.current.send("hi")
    })
    const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers).not.toHaveProperty("Authorization")
  })
})
