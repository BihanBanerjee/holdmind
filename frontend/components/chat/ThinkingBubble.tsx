"use client"

const dotStyle = (delay: string): React.CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  animationName: "pulse-dot",
  animationDuration: "1.4s",
  animationIterationCount: "infinite",
  animationDelay: delay,
})

export function ThinkingBubble() {
  return (
    <div className="flex flex-col items-start mb-3">
      <style>{`
        @keyframes pulse-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span
          data-testid="thinking-dot"
          className="bg-muted-foreground inline-block"
          style={dotStyle("0s")}
        />
        <span
          data-testid="thinking-dot"
          className="bg-muted-foreground inline-block"
          style={dotStyle("0.2s")}
        />
        <span
          data-testid="thinking-dot"
          className="bg-muted-foreground inline-block"
          style={dotStyle("0.4s")}
        />
      </div>
    </div>
  )
}
