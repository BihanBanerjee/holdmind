"use client"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Brain, Settings, LogOut, Sun, Moon, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NewChatButton } from "./NewChatButton"
import { ConversationList } from "./ConversationList"
import { useAuth } from "@/lib/auth-context"

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  function nav(path: string) {
    router.push(path)
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full w-60 border-r border-border bg-background">
      <div className="p-4 border-b border-border shrink-0">
        <span className="font-semibold text-lg tracking-tight">Holdmind</span>
      </div>
      <div className="p-2 shrink-0">
        <NewChatButton />
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <ConversationList onNavigate={onNavigate} />
      </div>
      <div className="p-2 border-t border-border flex flex-col gap-1 shrink-0">
        <Button
          variant={pathname === "/memories" ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => nav("/memories")}
        >
          <Brain className="mr-2 h-4 w-4" /> Memory Graph
        </Button>
        <Button
          variant={pathname === "/settings" ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => nav("/settings")}
        >
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Button
          variant="ghost"
          className="justify-start text-destructive hover:text-destructive"
          onClick={() => { logout() }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </div>
      {/* Mobile — hamburger in a top bar */}
      <div className="flex md:hidden items-center px-3 py-2 border-b border-border shrink-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-semibold">Holdmind</span>
      </div>
    </>
  )
}
