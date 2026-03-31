// frontend/__tests__/lib/auth-context.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, renderHook } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue(undefined),
  setTokenRefreshedCallback: vi.fn(),
}))

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"

/** Helper component that exposes auth actions for testing. */
function TestConsumer() {
  const { token, login, logout } = useAuth()
  return (
    <>
      <span data-testid="token">{token ?? "null"}</span>
      <button onClick={() => login("tok123")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    vi.mocked(apiFetch).mockClear()
  })

  it("loads token from localStorage on mount", async () => {
    localStorage.setItem("hm_token", "existing-token")
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("existing-token"),
    )
  })

  it("login stores token in localStorage and navigates to /chat", async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await user.click(screen.getByText("login"))
    expect(localStorage.getItem("hm_token")).toBe("tok123")
    expect(mockPush).toHaveBeenCalledWith("/chat")
  })

  it("login sets the token in context", async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await user.click(screen.getByText("login"))
    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("tok123"),
    )
  })

  it("logout calls /api/auth/logout, clears localStorage, and navigates to /login", async () => {
    localStorage.setItem("hm_token", "tok123")
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await user.click(screen.getByText("logout"))
    expect(apiFetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" })
    expect(localStorage.getItem("hm_token")).toBeNull()
    expect(mockPush).toHaveBeenCalledWith("/login")
  })
})

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    )
  })
})
