import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ThinkingBubble } from "@/components/chat/ThinkingBubble"

describe("ThinkingBubble", () => {
  it("renders three dots", () => {
    render(<ThinkingBubble />)
    const dots = screen.getAllByTestId("thinking-dot")
    expect(dots).toHaveLength(3)
  })

  it("has correct alignment classes (left-aligned like AI messages)", () => {
    const { container } = render(<ThinkingBubble />)
    expect(container.firstChild).toHaveClass("items-start")
  })

  it("applies staggered animation delays to dots", () => {
    render(<ThinkingBubble />)
    const dots = screen.getAllByTestId("thinking-dot")
    expect(dots[0]).toHaveStyle({ animationDelay: "0s" })
    expect(dots[1]).toHaveStyle({ animationDelay: "0.2s" })
    expect(dots[2]).toHaveStyle({ animationDelay: "0.4s" })
  })
})
