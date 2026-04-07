import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { HeroGraph } from "@/components/landing/HeroGraph"
import { PreviewGraph } from "@/components/landing/PreviewGraph"

export default async function LandingPage() {
  const store = await cookies()
  if (store.get("hm_auth")) {
    redirect("/chat")
  }

  return (
    <div className="min-h-screen bg-[#080808] text-foreground">
      <Nav />
      <Hero />
      <HowItWorks />
      <BeliefGraphSection />
      <MemoryTypes />
      <BottomCTA />
      <Footer />
    </div>
  )
}

/* ── Nav ─────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-border bg-[#080808]/80">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Holdmind" width={36} height={36} className="rounded-sm" />
          <span className="font-bold text-lg tracking-tight">Holdmind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ── Hero ────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-[#080808]">
      <div className="absolute inset-0 opacity-40">
        <HeroGraph />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Belief-centric memory engine
        </div>

        {/* Headline */}
        <h1 className="font-extrabold text-6xl lg:text-7xl tracking-tight leading-tight mb-6">
          <span className="text-white">Your beliefs,</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            not your notes.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Holdmind learns from every conversation — extracting what you know, how you feel, and
          what you believe. Then it thinks with you.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Sign up free
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-3 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            See how it works ↓
          </a>
        </div>
      </div>
    </section>
  )
}

/* ── How It Works ────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Chat naturally",
    desc: "Talk to Holdmind like any AI. No special commands.",
  },
  {
    num: "02",
    title: "Beliefs extracted",
    desc: "Facts, memories, and habits extracted and typed automatically.",
  },
  {
    num: "03",
    title: "Graph grows",
    desc: "Beliefs connect with typed edges: supports, contradicts, derives. Contradictions tracked, confidence updated automatically.",
  },
  {
    num: "04",
    title: "Memory recalls",
    desc: "Relevant beliefs surface in every new conversation.",
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          How It Works
        </p>
        <h2 className="text-3xl font-bold tracking-tight mb-12">
          From conversation to belief
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step) => (
            <div key={step.num}>
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-blue-500/30 text-blue-400 text-sm font-mono font-bold mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Belief Graph Preview ────────────────────────── */
function BeliefGraphSection() {
  return (
    <section className="py-24 px-6 bg-[#080808]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
            Belief Graph
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-6">See what you believe</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Every fact and memory is a node. Every relationship is an edge. Zoom in, click any
            node — your beliefs are interactive, explorable, and alive.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Green edges support. Red edges contradict. Dashed edges derive. The graph evolves with every conversation.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="border border-border rounded-2xl bg-[#0d0d0d] overflow-hidden h-72">
            <PreviewGraph />
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6]" />
              Semantic
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#a855f7]" />
              Episodic
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="4" className="shrink-0">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#22c55e" strokeWidth="1.5" />
              </svg>
              Supports
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="4" className="shrink-0">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#ef4444" strokeWidth="1.5" />
              </svg>
              Contradicts
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="4" className="shrink-0">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3,3" />
              </svg>
              Derives
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Memory Types ────────────────────────────────── */
const MEMORY_TYPES = [
  {
    color: "#3b82f6",
    title: "Semantic",
    desc: "Stable facts and beliefs about the world. 'I prefer Python.' 'Remote work suits me.' These persist, update with evidence, and rarely expire.",
    tag: "Stable · Long-term",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
  },
  {
    color: "#a855f7",
    title: "Episodic",
    desc: "Moments tied to time. 'I was debugging a FastAPI issue last Tuesday.' Vivid now, fades gracefully as time passes.",
    tag: "Time-bound · Fades",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
]

function MemoryTypes() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
          Memory Types
        </p>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Two kinds of knowing</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Not all memory is the same. Holdmind distinguishes stable facts from time-bound
          experiences — and stores each accordingly.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MEMORY_TYPES.map((m) => (
            <div
              key={m.title}
              className={`p-6 rounded-xl border ${m.border} ${m.bg}`}
            >
              <div
                className="w-3 h-3 rounded-full mb-4"
                style={{ backgroundColor: m.color }}
              />
              <h3 className="font-semibold text-foreground mb-3">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.desc}</p>
              <span
                className="inline-block px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  color: m.color,
                  borderColor: m.color + "40",
                  backgroundColor: m.color + "15",
                }}
              >
                {m.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Bottom CTA ──────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="py-32 px-6 bg-[#080808] text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Start building your belief graph.
        </h2>
        <p className="text-muted-foreground mb-10 text-lg">It only takes a conversation.</p>
        <Link
          href="/signup"
          className="inline-flex items-center px-8 py-3.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
        >
          Sign up free →
        </Link>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border py-6 px-12">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Holdmind" width={28} height={28} className="rounded-sm opacity-70" />
          <span className="text-sm text-muted-foreground font-semibold">Holdmind</span>
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  )
}
