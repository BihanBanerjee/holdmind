// frontend/__tests__/components/MessageBubble.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessageBubble } from "@/components/chat/MessageBubble"
import type { Claim } from "@/hooks/useChat"

describe("MessageBubble", () => {
  it("user message wrapper has items-end class", () => {
    const { container } = render(
      <MessageBubble role="user" content="Hello" />,
    )
    expect(container.firstChild).toHaveClass("items-end")
  })

  it("assistant message wrapper has items-start class", () => {
    const { container } = render(
      <MessageBubble role="assistant" content="Hi" />,
    )
    expect(container.firstChild).toHaveClass("items-start")
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

describe("MessageBubble — action bar", () => {

  it("shows copy button on assistant messages", () => {
    render(<MessageBubble role="assistant" content="Hello" />)
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument()
  })

  it("does not show action buttons on user messages", () => {
    render(<MessageBubble role="user" content="Hello" />)
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument()
  })

  it("copies content to clipboard when copy is clicked", async () => {
    const user = userEvent.setup()
    // userEvent.setup() installs a clipboard stub on navigator.clipboard; spy on it after setup
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)
    render(<MessageBubble role="assistant" content="Hello world" />)
    await user.click(screen.getByRole("button", { name: /copy/i }))
    expect(writeTextSpy).toHaveBeenCalledWith("Hello world")
    vi.restoreAllMocks()
  })

  it("shows regenerate button only when isLast=true and onRegenerate is provided", () => {
    const onRegenerate = vi.fn()
    render(<MessageBubble role="assistant" content="Hi" isLast onRegenerate={onRegenerate} />)
    expect(screen.getByRole("button", { name: /regenerate/i })).toBeInTheDocument()
  })

  it("does not show regenerate when isLast=false", () => {
    render(<MessageBubble role="assistant" content="Hi" isLast={false} onRegenerate={vi.fn()} />)
    expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument()
  })

  it("calls onRegenerate when regenerate is clicked", async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()
    render(<MessageBubble role="assistant" content="Hi" isLast onRegenerate={onRegenerate} />)
    await user.click(screen.getByRole("button", { name: /regenerate/i }))
    expect(onRegenerate).toHaveBeenCalledOnce()
  })

  it("toggles thumbs up state on click", async () => {
    const user = userEvent.setup()
    render(<MessageBubble role="assistant" content="Hi" />)
    const btn = screen.getByRole("button", { name: /thumbs up/i })
    await user.click(btn)
    expect(btn).toHaveAttribute("data-active", "true")
    await user.click(btn)
    expect(btn).toHaveAttribute("data-active", "false")
  })

  it("does not set copied state when clipboard write fails", async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"))
    render(<MessageBubble role="assistant" content="Hello" />)
    await user.click(screen.getByRole("button", { name: /copy/i }))
    // Check icon should NOT appear — button still shows Copy icon
    expect(screen.queryByRole("button", { name: /copy/i })).toBeInTheDocument()
  })

  it("clicking thumbs down clears thumbs up and vice versa", async () => {
    const user = userEvent.setup()
    render(<MessageBubble role="assistant" content="Hi" />)
    const upBtn = screen.getByRole("button", { name: /thumbs up/i })
    const downBtn = screen.getByRole("button", { name: /thumbs down/i })
    await user.click(upBtn)
    expect(upBtn).toHaveAttribute("data-active", "true")
    expect(downBtn).toHaveAttribute("data-active", "false")
    await user.click(downBtn)
    expect(downBtn).toHaveAttribute("data-active", "true")
    expect(upBtn).toHaveAttribute("data-active", "false")
  })
})

describe("MessageBubble — claim annotations", () => {
  const claims: Claim[] = [
    { id: "1", type: "semantic", text: "sky is blue", confidence: 0.9 },
    { id: "2", type: "episodic", text: "visited Paris", confidence: 0.7 },
  ]

  it("renders a badge for each claim when claims prop is provided", () => {
    render(<MessageBubble role="assistant" content="Hi" claims={claims} />)
    expect(screen.getByText("sky is blue")).toBeInTheDocument()
    expect(screen.getByText("visited Paris")).toBeInTheDocument()
  })

  it("renders the claim type alongside each badge", () => {
    render(<MessageBubble role="assistant" content="Hi" claims={claims} />)
    expect(screen.getAllByText("semantic")).toHaveLength(1)
    expect(screen.getAllByText("episodic")).toHaveLength(1)
  })

  it("does not render claim section when claims is undefined", () => {
    render(<MessageBubble role="assistant" content="Hi" />)
    expect(screen.queryByText("Extracted memories")).not.toBeInTheDocument()
  })

  it("does not render claim section when claims is an empty array", () => {
    render(<MessageBubble role="assistant" content="Hi" claims={[]} />)
    expect(screen.queryByText("Extracted memories")).not.toBeInTheDocument()
  })

  it("does not render claim section on user messages even with claims prop", () => {
    render(<MessageBubble role="user" content="Hello" claims={claims} />)
    expect(screen.queryByText("sky is blue")).not.toBeInTheDocument()
  })
})
