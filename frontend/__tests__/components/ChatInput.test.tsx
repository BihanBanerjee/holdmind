// frontend/__tests__/components/ChatInput.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatInput } from "@/components/chat/ChatInput"

describe("ChatInput", () => {
  it("renders a textarea with the correct placeholder", () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByPlaceholderText("Message Holdmind…")).toBeInTheDocument()
  })

  it("calls onSend with trimmed value when Enter is pressed", async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByPlaceholderText("Message Holdmind…")
    await user.type(textarea, "  hello world  ")
    await user.keyboard("{Enter}")
    expect(onSend).toHaveBeenCalledOnce()
    expect(onSend).toHaveBeenCalledWith("hello world")
  })

  it("does NOT call onSend when Shift+Enter is pressed", async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByPlaceholderText("Message Holdmind…")
    await user.type(textarea, "hello")
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    expect(onSend).not.toHaveBeenCalled()
  })

  it("does NOT call onSend when the input is only whitespace", async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByPlaceholderText("Message Holdmind…")
    await user.type(textarea, "   ")
    await user.keyboard("{Enter}")
    expect(onSend).not.toHaveBeenCalled()
  })

  it("clears the textarea after a successful send", async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(
      "Message Holdmind…",
    ) as HTMLTextAreaElement
    await user.type(textarea, "hello")
    await user.keyboard("{Enter}")
    expect(textarea.value).toBe("")
  })

  it("send button is disabled when textarea is empty", () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("shows animate-spin spinner icon when disabled prop is true", () => {
    render(<ChatInput onSend={vi.fn()} disabled />)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("does NOT call onSend on Enter when disabled prop is true", async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} disabled />)
    const textarea = screen.getByPlaceholderText("Message Holdmind…")
    await user.type(textarea, "hello")
    await user.keyboard("{Enter}")
    expect(onSend).not.toHaveBeenCalled()
  })
})
