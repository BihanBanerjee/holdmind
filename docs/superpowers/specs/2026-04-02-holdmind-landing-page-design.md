# Holdmind Landing Page — Design Spec

**Date:** 2026-04-02
**Status:** Approved

---

## Goal

A public-facing landing page at the root route (`/`) for Holdmind. Targets potential users (real SaaS audience). Tone is cerebral and philosophical — aspirational, not feature-listy. CTA is "Sign up free".

Currently the root route redirects straight to `/login` or `/chat`. The landing page replaces that redirect for unauthenticated visitors; authenticated users still go straight to `/chat`.

---

## Architecture

A new Next.js page at `app/(marketing)/page.tsx` under a new route group `(marketing)`. This keeps the landing page isolated from the auth and app route groups. A separate layout `app/(marketing)/layout.tsx` handles the nav so it doesn't inherit the app shell (sidebar, providers).

The page is a single scroll with 6 sections rendered server-side (no `"use client"` at the page level). The only client component is `HeroGraph` — a canvas-based D3 animation that needs browser APIs.

**No new dependencies.** D3 is already installed. Animations use CSS keyframes via `tw-animate-css` (already installed) for entrance effects. No Framer Motion.

---

## Route Logic Change

`app/page.tsx` currently redirects all unauthenticated visitors to `/login`. Change it to redirect unauthenticated visitors to `/` (the landing page) instead — meaning remove the redirect and let the `(marketing)` group handle the root.

Specifically:
- `app/page.tsx` → remove; the `(marketing)/page.tsx` becomes the root handler
- Authenticated visitors (`hm_auth` cookie present) → redirect to `/chat` from the landing page itself

---

## File Structure

| File | Purpose |
|---|---|
| `app/(marketing)/layout.tsx` | Minimal layout: no sidebar, no app shell, just `ThemeProvider` + `children` |
| `app/(marketing)/page.tsx` | Landing page — server component, composes all sections |
| `components/landing/HeroGraph.tsx` | `"use client"` canvas D3 animation for hero background |
| `components/landing/PreviewGraph.tsx` | `"use client"` canvas D3 animation for graph preview section |

No new UI primitives needed — all sections use raw HTML + Tailwind.

---

## Sections

### 1. Nav
- Sticky, `backdrop-blur`, `border-b border-border`
- Left: "Holdmind" wordmark (`font-bold text-lg tracking-tight`)
- Right: "Sign in" (ghost button → `/login`) + "Sign up free" (primary button → `/signup`)
- No mobile hamburger needed — two buttons fit on any screen

### 2. Hero
- `min-h-[88vh]`, dark background (`bg-[#080808]`), centered content
- `HeroGraph` canvas fills the section as `position: absolute, inset-0, opacity-40`
- Badge: `"Belief-centric memory engine"` — blue pill with animated pulse dot
- Headline: `"Your beliefs,"` (white) + `"not your notes."` (blue→purple gradient), `font-extrabold text-6xl lg:text-7xl tracking-tight`
- Subheadline: `"Holdmind learns from every conversation — extracting what you know, how you feel, and what you believe. Then it thinks with you."` — `text-muted-foreground text-lg`
- CTAs: `"Sign up free"` (primary, → `/signup`) + `"See how it works ↓"` (ghost, smooth-scrolls to features section)

### 3. How It Works
- `id="how-it-works"` — target for the hero scroll link
- Label: `"HOW IT WORKS"`, Title: `"From conversation to belief"`
- 4-step grid (`grid-cols-4` desktop, `grid-cols-2` tablet, `grid-cols-1` mobile)
- Each step: numbered badge (01–04) + title + 2-line description
  1. **Chat naturally** — Talk to Holdmind like any AI. No special commands.
  2. **Beliefs extracted** — Facts, memories, and habits extracted and typed automatically.
  3. **Graph grows** — Beliefs connect with typed edges: supports, contradicts, derives. Contradictions tracked, not hidden.
  4. **Memory recalls** — Relevant beliefs surface in every new conversation.

### 4. Belief Graph Preview
- Two-column layout: copy left, animated graph right (`grid-cols-[1fr_1.4fr]`, stacks on mobile)
- Label: `"BELIEF GRAPH"`, Title: `"See what you believe"`
- Body copy: "Every fact and memory is a node. Every relationship is an edge. Zoom in, click any node — your beliefs are interactive, explorable, and alive."
- Sub-copy: "Nodes fade with age. Edges carry meaning — green for support, red for contradiction."
- Right: `PreviewGraph` — canvas with ~10 labelled nodes, typed edges (supports=green, contradicts=red, derives=gray), slow float animation. Rendered inside a dark card frame with `border border-border rounded-2xl`.

### 5. Memory Types
- Label: `"MEMORY TYPES"`, Title: `"Three kinds of knowing"`
- Sub: "Not all memory is the same. Holdmind distinguishes facts from experiences from habits — and stores each accordingly."
- 3-column card grid (`grid-cols-3` desktop, `grid-cols-1` mobile)
  - **Semantic** (blue `#3b82f6`) — "Stable facts and beliefs about the world. 'I prefer Python.' 'Remote work suits me.' These persist, update with evidence, and rarely expire." — tag: `Stable · Long-term`
  - **Episodic** (purple `#a855f7`) — "Moments tied to time. 'I was debugging a FastAPI issue last Tuesday.' Vivid now, fades gracefully as time passes." — tag: `Time-bound · Fades`
  - **Procedural** (teal `#14b8a6`) — "Habits and patterns. 'When I'm stuck, I reach for a rubber duck.' Detected from recurring behaviour and surfaced as triggers." — tag: `Behavioural · Pattern`
- Each card: colored dot, title, body, tag pill. Subtle tinted background + matching border.

### 6. Bottom CTA
- Centered, `py-32`
- Headline: `"Start building your belief graph."` — large, bold
- Sub: `"It only takes a conversation."`
- Single primary CTA: `"Sign up free →"` → `/signup`

### 7. Footer
- `border-t border-border`, `py-6 px-12`
- Left: "Holdmind" wordmark in `text-muted-foreground`
- Right: "Sign in" + "Sign up" links in `text-muted-foreground`

---

## HeroGraph Component

```
"use client"
Canvas element fills parent (position: absolute, inset: 0).
~28 nodes, random positions, slow velocity drift (bounce off edges).
Edges drawn between nodes within 130px distance; opacity proportional to 1 - d/130.
Node colors: semantic=#3b82f6, episodic=#a855f7.
Soft glow ring (larger radius, very low opacity) behind each node.
No labels in hero — purely decorative.
ResizeObserver keeps canvas sized to parent.
requestAnimationFrame loop.
```

## PreviewGraph Component

```
"use client"
Canvas fills its container frame.
~10 nodes with real-looking labels ("sky is blue", "Python preferred", "remote work", etc.).
Typed edges: supports (green), contradicts (red), derives (gray).
Nodes have confidence opacity (0.4 + confidence * 0.5).
Node color by type: semantic=blue, episodic=purple, procedural=teal.
Labels rendered above each node (10px, truncated at 18 chars).
Same float + bounce animation as HeroGraph.
```

---

## Routing

| Path | Behaviour |
|---|---|
| `/` | Landing page (unauthenticated) → show landing; authenticated → redirect `/chat` |
| `/login` | Existing login page (unchanged) |
| `/signup` | Existing signup page (unchanged) |

The `(marketing)/page.tsx` checks the `hm_auth` cookie server-side and redirects to `/chat` if present. Otherwise renders the landing page.

---

## Styling Notes

- Background: `#080808` for hero and alternating sections; `bg-background` (from theme) for others
- All body text uses existing theme tokens (`text-muted-foreground`, `text-foreground`, `border-border`)
- No new CSS variables — everything via existing Tailwind config
- Section padding: `py-24 px-12` desktop, `py-16 px-6` mobile
- Max content width: `max-w-5xl mx-auto`

---

## Out of Scope

- Mobile nav hamburger (two buttons fit everywhere)
- Animations on scroll (no Framer Motion, no IntersectionObserver)
- Screenshot or video of the real app UI
- Dark/light mode toggle on landing page (inherits existing `ThemeProvider` default: dark)
