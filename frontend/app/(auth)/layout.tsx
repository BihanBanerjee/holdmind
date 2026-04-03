import Link from "next/link"
import { HeroGraph } from "@/components/landing/HeroGraph"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:block bg-[#080808] overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <HeroGraph />
          </div>
          <div className="relative flex h-full flex-col justify-between p-12">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">Holdmind</span>
            </Link>

            <div className="space-y-4">
              <p className="text-3xl font-bold text-white leading-snug">
                Your beliefs,
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  not your notes.
                </span>
              </p>
              <p className="text-white/50 text-sm max-w-xs">
                Facts. Experiences. Patterns.
                <br />
                A memory that understands what you believe.
              </p>
            </div>

            <p className="text-white/30 text-xs">Belief-centric memory engine</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">Holdmind</span>
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
