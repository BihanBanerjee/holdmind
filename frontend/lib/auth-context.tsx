"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
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
    document.cookie = "hm_auth=1; path=/"
    setToken(t)
    router.push("/chat")
  }

  function logout() {
    localStorage.removeItem("hm_token")
    document.cookie = "hm_auth=; path=/; max-age=0"
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
