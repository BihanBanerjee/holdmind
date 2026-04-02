import { describe, it, expect, vi, beforeAll } from "vitest"
import { render } from "@testing-library/react"
import { PreviewGraph } from "@/components/landing/PreviewGraph"

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
})

describe("PreviewGraph", () => {
  it("renders a canvas element without crashing", () => {
    const { container } = render(<PreviewGraph />)
    expect(container.querySelector("canvas")).toBeTruthy()
  })
})
