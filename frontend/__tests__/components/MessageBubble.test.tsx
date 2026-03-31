// frontend/__tests__/components/MessageBubble.test.tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MessageBubble } from "@/components/chat/MessageBubble"

describe("MessageBubble", () => {
  it("user message wrapper has justify-end class", () => {
    const { container } = render(
      <MessageBubble role="user" content="Hello" />,
    )
    expect(container.firstChild).toHaveClass("justify-end")
  })

  it("assistant message wrapper has justify-start class", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="Hi" />,
    )
    expect(container.firstChild).toHaveClass("justify-start")
  })

  it("renders plain text when no highlight prop is given", () => {
    render(<MessageBubble role="user" content="Hello world" />)
    expect(screen.getByText("Hello world")).toBeInTheDocument()
    expect(document.querySelectorAll("mark")).toHaveLength(0)
  })

  it("wraps the matching word in <mark> when highlight is provided", () => {
    render(
      <MessageBubble role="user" content="Hello world" highlight="world" />,
    )
    const marks = document.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe("world")
  })

  it("highlight matching is case-insensitive", () => {
    render(
      <MessageBubble role="user" content="Hello World" highlight="world" />,
    )
    const mark = document.querySelector("mark")
    expect(mark).not.toBeNull()
    expect(mark!.textContent).toBe("World")
  })

  it("non-matching parts are not wrapped in mark", () => {
    render(
      <MessageBubble role="user" content="Hello world" highlight="world" />,
    )
    const marks = document.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
  })
})
