import { describe, it, expect } from "vitest"
import { filterMemories } from "@/lib/filterMemories"
import type { GraphData } from "@/hooks/useMemories"

const data: GraphData = {
  nodes: [
    { id: "1", type: "semantic", label: "sky is blue", confidence: 0.9, importance: 0.8 },
    { id: "2", type: "episodic", label: "visited Paris", confidence: 0.7, importance: 0.6 },
    { id: "3", type: "semantic", label: "water is wet", confidence: 0.95, importance: 0.9 },
  ],
  links: [
    { source: "1", target: "3", relation: "supports" },
    { source: "1", target: "2", relation: "derives" },
  ],
}

describe("filterMemories", () => {
  it("returns all nodes and links with filter=all and empty search", () => {
    const result = filterMemories(data, "all", "")
    expect(result.nodes).toHaveLength(3)
    expect(result.links).toHaveLength(2)
  })

  it("filters to semantic nodes only", () => {
    const result = filterMemories(data, "semantic", "")
    expect(result.nodes).toHaveLength(2)
    expect(result.nodes.every(n => n.type === "semantic")).toBe(true)
    expect(result.links).toHaveLength(1)
    expect(result.links[0]).toMatchObject({ source: "1", target: "3" })
  })

  it("filters to episodic nodes only", () => {
    const result = filterMemories(data, "episodic", "")
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe("2")
    expect(result.links).toHaveLength(0)
  })

  it("filters by search term (case-insensitive)", () => {
    const result = filterMemories(data, "all", "SKY")
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe("1")
    expect(result.links).toHaveLength(0)
  })

  it("combines type filter and search", () => {
    const result = filterMemories(data, "semantic", "wet")
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].label).toBe("water is wet")
  })

  it("removes links whose source or target is filtered out", () => {
    const result = filterMemories(data, "all", "Paris")
    expect(result.nodes).toHaveLength(1)
    expect(result.links).toHaveLength(0)
  })

  it("returns empty nodes and links when search matches nothing", () => {
    const result = filterMemories(data, "all", "xyznotfound")
    expect(result.nodes).toHaveLength(0)
    expect(result.links).toHaveLength(0)
  })
})
