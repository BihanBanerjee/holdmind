import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryList } from "@/components/memories/MemoryList"
import type { GraphNode } from "@/hooks/useMemories"

const nodes: GraphNode[] = [
  { id: "1", type: "semantic", label: "sky is blue", confidence: 0.9, importance: 0.8, created_at: 1743500000 },
  { id: "2", type: "episodic", label: "visited Paris", confidence: 0.5, importance: 0.6, created_at: 1743500000 },
  { id: "3", type: "semantic", label: "water is wet", confidence: 0.7, importance: 0.9, created_at: 1743500000 },
]

describe("MemoryList", () => {
  it("renders a card for each node", () => {
    render(<MemoryList nodes={nodes} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByText("sky is blue")).toBeInTheDocument()
    expect(screen.getByText("visited Paris")).toBeInTheDocument()
    expect(screen.getByText("water is wet")).toBeInTheDocument()
  })

  it("sorts nodes by confidence descending", () => {
    render(<MemoryList nodes={nodes} selectedId={null} onSelectNode={() => {}} />)
    const cards = screen.getAllByRole("button")
    expect(cards[0]).toHaveTextContent("sky is blue")    // 0.9
    expect(cards[1]).toHaveTextContent("water is wet")   // 0.7
    expect(cards[2]).toHaveTextContent("visited Paris")  // 0.5
  })

  it("calls onSelectNode with node id when card is clicked", () => {
    const onSelectNode = vi.fn()
    render(<MemoryList nodes={nodes} selectedId={null} onSelectNode={onSelectNode} />)
    fireEvent.click(screen.getByText("sky is blue").closest("button")!)
    expect(onSelectNode).toHaveBeenCalledWith("1")
  })

  it("highlights the selected card with border-primary", () => {
    render(<MemoryList nodes={nodes} selectedId="2" onSelectNode={() => {}} />)
    const selectedCard = screen.getByText("visited Paris").closest("button")!
    expect(selectedCard).toHaveClass("border-primary")
  })

  it("does not highlight unselected cards with border-primary", () => {
    render(<MemoryList nodes={nodes} selectedId="2" onSelectNode={() => {}} />)
    const otherCard = screen.getByText("sky is blue").closest("button")!
    expect(otherCard).not.toHaveClass("border-primary")
  })

  it("shows empty state message when nodes array is empty", () => {
    render(<MemoryList nodes={[]} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByText("No memories match your filter.")).toBeInTheDocument()
  })

  it("renders confidence as a percentage", () => {
    render(<MemoryList nodes={[nodes[0]]} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByText("90%")).toBeInTheDocument()
  })

  it("renders type badge for each card", () => {
    render(<MemoryList nodes={[nodes[0], nodes[1]]} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByText("semantic")).toBeInTheDocument()
    expect(screen.getByText("episodic")).toBeInTheDocument()
  })
})
