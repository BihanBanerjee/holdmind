"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "./api"

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setToken(localStorage.getItem("hm_token"))
  }, [])

  function login(t: string) {
    localStorage.setItem("hm_token", t)
    const secure = location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `hm_auth=1; path=/; SameSite=Strict${secure}`
    setToken(t)
    router.push("/chat")
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } catch {
      // best-effort — clear local state regardless
    }
    localStorage.removeItem("hm_token")
    const secure = location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `hm_auth=; path=/; max-age=0; SameSite=Strict${secure}`
    setToken(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
