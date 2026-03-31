// frontend/__tests__/components/ClaimsPanel.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClaimsPanel } from "@/components/chat/ClaimsPanel"
import type { Claim } from "@/hooks/useChat"

vi.mock("@/hooks/useChat", () => ({}))

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    type: "semantic",
    text: "User likes pizza",
    confidence: 0.9,
    ...overrides,
  }
}

describe("ClaimsPanel", () => {
  it("renders null when claims array is empty", () => {
    const { container } = render(<ClaimsPanel claims={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows '1 memory extracted' for a single claim", () => {
    render(<ClaimsPanel claims={[makeClaim()]} />)
    expect(screen.getByText("1 memory extracted")).toBeInTheDocument()
  })

  it("shows '2 memories extracted' for two claims", () => {
    render(
      <ClaimsPanel
        claims={[makeClaim({ id: "c1" }), makeClaim({ id: "c2", text: "User hates mornings" })]}
      />,
    )
    expect(screen.getByText("2 memories extracted")).toBeInTheDocument()
  })

  it("renders claim type badge and text", () => {
    render(<ClaimsPanel claims={[makeClaim()]} />)
    expect(screen.getByText("semantic")).toBeInTheDocument()
    expect(screen.getByText("User likes pizza")).toBeInTheDocument()
  })

  it("renders confidence percentage", () => {
    render(<ClaimsPanel claims={[makeClaim({ confidence: 0.75 })]} />)
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("collapses claim list when header button is clicked", async () => {
    const user = userEvent.setup()
    render(<ClaimsPanel claims={[makeClaim()]} />)
    expect(screen.getByText("User likes pizza")).toBeInTheDocument()
    await user.click(screen.getByText("1 memory extracted"))
    expect(screen.queryByText("User likes pizza")).not.toBeInTheDocument()
  })

  it("re-expands when header button is clicked twice", async () => {
    const user = userEvent.setup()
    render(<ClaimsPanel claims={[makeClaim()]} />)
    await user.click(screen.getByText("1 memory extracted"))
    await user.click(screen.getByText("1 memory extracted"))
    expect(screen.getByText("User likes pizza")).toBeInTheDocument()
  })
})
