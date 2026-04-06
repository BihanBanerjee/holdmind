import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Mock next/navigation
const pushMock = vi.fn()
const replaceMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

// Mock useConversations — return empty items so empty state shows
vi.mock("@/hooks/useConversations", () => ({
  useConversations: () => ({ data: { items: [] }, isLoading: false }),
  useCreateConversation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-conv-123" }),
  }),
}))

// Import after mocks
import ChatIndexPage from "@/app/(app)/chat/page"

describe("ChatIndexPage — empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the Holdmind wordmark", () => {
    render(<ChatIndexPage />)
    expect(screen.getByText("Holdmind")).toBeInTheDocument()
  })

  it("renders the tagline", () => {
    render(<ChatIndexPage />)
    expect(screen.getByText("What's on your mind?")).toBeInTheDocument()
  })

  it("renders 4 prompt chips", () => {
    render(<ChatIndexPage />)
    expect(screen.getByText("Tell me about yourself")).toBeInTheDocument()
    expect(screen.getByText("What do you remember about me?")).toBeInTheDocument()
    expect(screen.getByText("I just started a new job")).toBeInTheDocument()
    expect(screen.getByText("Help me think through something")).toBeInTheDocument()
  })

  it("clicking a chip creates a conversation and navigates with prompt param", async () => {
    const user = userEvent.setup()
    render(<ChatIndexPage />)
    await user.click(screen.getByText("Tell me about yourself"))
    expect(pushMock).toHaveBeenCalledWith(
      "/chat/new-conv-123?prompt=Tell+me+about+yourself",
    )
  })
})
