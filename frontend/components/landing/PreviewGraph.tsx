"use client"

import { useEffect, useRef } from "react"

type EdgeType = "supports" | "contradicts" | "derives"
type NodeType = "semantic" | "episodic" | "procedural"

interface PNode {
  id: string
  label: string
  type: NodeType
  confidence: number
  x: number
  y: number
  vx: number
  vy: number
}

interface PEdge {
  from: string
  to: string
  type: EdgeType
}

const NODE_COLOR: Record<NodeType, string> = {
  semantic: "#3b82f6",
  episodic: "#a855f7",
  procedural: "#14b8a6",
}

const EDGE_COLOR: Record<EdgeType, string> = {
  supports: "#22c55e",
  contradicts: "#ef4444",
  derives: "#9ca3af",
}

const INITIAL_NODES: Omit<PNode, "x" | "y" | "vx" | "vy">[] = [
  { id: "1", label: "sky is blue", type: "semantic", confidence: 0.95 },
  { id: "2", label: "Python preferred", type: "semantic", confidence: 0.9 },
  { id: "3", label: "remote work suits me", type: "semantic", confidence: 0.85 },
  { id: "4", label: "debugged FastAPI", type: "episodic", confidence: 0.75 },
  { id: "5", label: "reach for rubber duck", type: "procedural", confidence: 0.8 },
  { id: "6", label: "prefer dark mode", type: "semantic", confidence: 0.9 },
  { id: "7", label: "visited Tokyo", type: "episodic", confidence: 0.7 },
  { id: "8", label: "TypeScript skilled", type: "semantic", confidence: 0.88 },
  { id: "9", label: "morning coder", type: "procedural", confidence: 0.72 },
  { id: "10", label: "reads daily", type: "procedural", confidence: 0.65 },
]

const EDGES: PEdge[] = [
  { from: "2", to: "8", type: "supports" },
  { from: "4", to: "2", type: "derives" },
  { from: "5", to: "4", type: "supports" },
  { from: "3", to: "9", type: "supports" },
  { from: "6", to: "3", type: "supports" },
  { from: "7", to: "4", type: "supports" },
  { from: "9", to: "10", type: "derives" },
]

function truncate(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}

function initNodes(w: number, h: number): PNode[] {
  return INITIAL_NODES.map((n) => ({
    ...n,
    x: 40 + Math.random() * (w - 80),
    y: 40 + Math.random() * (h - 80),
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }))
}

export function PreviewGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let nodes: PNode[] = []
    let raf = 0

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodes = initNodes(canvas.width, canvas.height)
    }

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const nodeMap = new Map(nodes.map((n) => [n.id, n]))

      // Draw edges
      for (const edge of EDGES) {
        const from = nodeMap.get(edge.from)
        const to = nodeMap.get(edge.to)
        if (!from || !to) continue

        ctx.beginPath()
        ctx.strokeStyle = EDGE_COLOR[edge.type] + "99"
        ctx.lineWidth = 1.5
        if (edge.type === "contradicts") {
          ctx.setLineDash([4, 3])
        } else {
          ctx.setLineDash([])
        }
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw nodes + labels
      ctx.font = "10px Inter, sans-serif"
      for (const n of nodes) {
        const alpha = 0.4 + n.confidence * 0.5
        const color = NODE_COLOR[n.type]

        // Glow
        const grd = ctx.createRadialGradient(n.x, n.y, 4, n.x, n.y, 18)
        grd.addColorStop(0, color + "44")
        grd.addColorStop(1, color + "00")
        ctx.beginPath()
        ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Node
        ctx.beginPath()
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0")
        ctx.fill()

        // Label
        const label = truncate(n.label)
        const measured = ctx.measureText(label).width
        ctx.fillStyle = "rgba(220,220,255,0.75)"
        ctx.fillText(label, n.x - measured / 2, n.y - 10)
      }

      // Update positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 20 || n.x > W - 20) n.vx *= -1
        if (n.y < 20 || n.y > H - 20) n.vy *= -1
      }

      raf = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    draw()

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Animated belief graph preview"
    />
  )
}
