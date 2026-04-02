import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BeliefGraph } from "@/components/memories/BeliefGraph"
import type { GraphData } from "@/hooks/useMemories"

const now = Date.now() / 1000

const data: GraphData = {
  nodes: [
    { id: "1", type: "semantic", label: "sky is blue", confidence: 0.9, importance: 0.8, created_at: now },
    { id: "2", type: "episodic", label: "visited Paris", confidence: 0.7, importance: 0.6, created_at: now - 86400 * 10 },
  ],
  links: [{ source: "1", target: "2", relation: "supports" }],
}

describe("BeliefGraph — zoom controls", () => {
  it("renders zoom in button", () => {
    render(<BeliefGraph data={data} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument()
  })

  it("renders zoom out button", () => {
    render(<BeliefGraph data={data} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument()
  })

  it("renders reset zoom button", () => {
    render(<BeliefGraph data={data} selectedId={null} onSelectNode={() => {}} />)
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeInTheDocument()
  })
})
