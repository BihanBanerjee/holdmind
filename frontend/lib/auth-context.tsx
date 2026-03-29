"use client"
import { createContext, useContext } from "react"

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={{ token: null, login: () => {}, logout: () => {} }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
