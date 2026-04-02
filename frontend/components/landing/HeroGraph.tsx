"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  glowColor: string
}

const SEMANTIC_COLOR = "#3b82f6"
const EPISODIC_COLOR = "#a855f7"
const EDGE_DISTANCE = 130
const NODE_COUNT = 28

function makeNodes(w: number, h: number): Node[] {
  return Array.from({ length: NODE_COUNT }, () => {
    const isSemantic = Math.random() > 0.4
    const color = isSemantic ? SEMANTIC_COLOR : EPISODIC_COLOR
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 3 + Math.random() * 3,
      color,
      glowColor: color,
    }
  })
}

export function HeroGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let nodes: Node[] = []
    let raf: number

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodes = makeNodes(canvas.width, canvas.height)
    }

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < EDGE_DISTANCE) {
            const alpha = (1 - d / EDGE_DISTANCE) * 0.25
            ctx.beginPath()
            ctx.strokeStyle = `rgba(100,120,200,${alpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        // Glow ring
        const grd = ctx.createRadialGradient(n.x, n.y, n.r, n.x, n.y, n.r * 5)
        grd.addColorStop(0, n.glowColor + "33")
        grd.addColorStop(1, n.glowColor + "00")
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Node dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = n.color + "cc"
        ctx.fill()
      }

      // Update positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
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
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
