// frontend/__tests__/components/ConversationItem.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { usePathname } from "next/navigation"
import { ConversationItem } from "@/components/sidebar/ConversationItem"
import type { Conversation } from "@/hooks/useConversations"

const mockPush = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: vi.fn(() => "/chat/other-id"),
}))

vi.mock("@/hooks/useConversations", async (importOriginal) => {
  const original =
    (await importOriginal()) as typeof import("@/hooks/useConversations")
  return {
    ...original,
    usePatchConversation: () => ({ mutate: mockPatch }),
    useDeleteConversation: () => ({ mutate: mockDelete }),
  }
})

// Mock Radix DropdownMenu to render inline without portals/focus management.
// This avoids the onCloseAutoFocus → blur → commitRename race that resets renaming state.
vi.mock("@/components/ui/dropdown-menu", () => {
  const React = require("react")
  const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (v: boolean) => void
  }>({ open: false, setOpen: () => {} })

  function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    return (
      <DropdownMenuContext.Provider value={{ open, setOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    )
  }
  function DropdownMenuTrigger({
    children,
    asChild,
  }: {
    children: React.ReactNode
    asChild?: boolean
  }) {
    const { setOpen } = React.useContext(DropdownMenuContext)
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          ;(children as React.ReactElement<any>).props.onClick?.(e)
          setOpen(true)
        },
      })
    }
    return (
      <button onClick={() => setOpen(true)}>{children}</button>
    )
  }
  function DropdownMenuContent({
    children,
  }: {
    children: React.ReactNode
    align?: string
  }) {
    const { open } = React.useContext(DropdownMenuContext)
    if (!open) return null
    return <div data-testid="dropdown-content">{children}</div>
  }
  function DropdownMenuItem({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: (e: React.MouseEvent) => void
  }) {
    const { setOpen } = React.useContext(DropdownMenuContext)
    return (
      <div
        role="menuitem"
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
      >
        {children}
      </div>
    )
  }
  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  }
})

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv1",
    title: "My Chat",
    archived: false,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("ConversationItem", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockPatch.mockClear()
    mockDelete.mockClear()
    vi.mocked(usePathname).mockReturnValue("/chat/other-id")
  })

  it("renders the conversation title", () => {
    render(<ConversationItem conversation={makeConversation()} />)
    expect(screen.getByText("My Chat")).toBeInTheDocument()
  })

  it("navigates to /chat/{id} when the item is clicked", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByText("My Chat"))
    expect(mockPush).toHaveBeenCalledWith("/chat/conv1")
  })

  it("calls onNavigate callback when the item is clicked", async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} onNavigate={onNavigate} />)
    await user.click(screen.getByText("My Chat"))
    expect(onNavigate).toHaveBeenCalledOnce()
  })

  it("enters rename mode when Rename is selected from the dropdown", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Rename"))
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("commits rename and calls patch on Enter", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Rename"))
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "New Title" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(mockPatch).toHaveBeenCalledWith({ id: "conv1", title: "New Title" })
  })

  it("cancels rename on Escape without calling patch", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Rename"))
    const input = screen.getByRole("textbox")
    fireEvent.keyDown(input, { key: "Escape" })
    expect(mockPatch).not.toHaveBeenCalled()
    expect(screen.getByText("My Chat")).toBeInTheDocument()
  })

  it("shows archive confirmation dialog when Archive is clicked", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Archive"))
    expect(await screen.findByText("Archive conversation?")).toBeInTheDocument()
  })

  it("calls patch with archived: true when dialog Confirm is clicked", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Archive"))
    await user.click(await screen.findByText("Confirm"))
    expect(mockPatch).toHaveBeenCalledWith(
      { id: "conv1", archived: true },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it("shows Unarchive option for an archived conversation", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation({ archived: true })} />)
    await user.click(screen.getByRole("button"))
    expect(await screen.findByText("Unarchive")).toBeInTheDocument()
  })

  it("shows delete confirmation dialog when Delete is clicked", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Delete"))
    expect(await screen.findByText("Delete conversation?")).toBeInTheDocument()
  })

  it("calls delete mutation when dialog Confirm is clicked", async () => {
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Delete"))
    await user.click(await screen.findByText("Delete forever"))
    expect(mockDelete).toHaveBeenCalledWith(
      "conv1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it("calls router.push('/chat') on delete onSuccess when conversation is active", async () => {
    vi.mocked(usePathname).mockReturnValue("/chat/conv1")
    const user = userEvent.setup()
    render(<ConversationItem conversation={makeConversation()} />)
    await user.click(screen.getByRole("button"))
    await user.click(await screen.findByText("Delete"))
    await user.click(await screen.findByText("Delete forever"))
    // Capture the onSuccess callback and invoke it
    const [[, { onSuccess }]] = mockDelete.mock.calls
    onSuccess()
    expect(mockPush).toHaveBeenCalledWith("/chat")
  })
})
