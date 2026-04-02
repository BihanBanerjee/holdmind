import { describe, it, expect, vi, beforeAll } from "vitest"
import { render } from "@testing-library/react"
import { HeroGraph } from "@/components/landing/HeroGraph"

beforeAll(() => {
  // jsdom doesn't implement canvas — provide a stub
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  } as unknown as CanvasRenderingContext2D)
})

describe("HeroGraph", () => {
  it("renders a canvas element without crashing", () => {
    const { container } = render(<HeroGraph />)
    expect(container.querySelector("canvas")).toBeTruthy()
  })
})
