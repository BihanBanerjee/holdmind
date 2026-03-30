const BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

export async function apiFetch<T = void>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await _doFetch(path, options)

  if (res.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await _tryRefresh()
    if (refreshed) {
      const retryRes = await _doFetch(path, options)
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}))
        throw new Error((body as any).detail ?? `HTTP ${retryRes.status}`)
      }
      if (retryRes.status === 204) return undefined as T
      return retryRes.json() as Promise<T>
    }
    // Refresh failed — clear local state and redirect
    if (typeof window !== "undefined") {
      localStorage.removeItem("hm_token")
      window.location.href = "/login"
    }
    throw new Error("Session expired")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).detail ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function _doFetch(path: string, options: RequestInit): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hm_token") : null
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
}

async function _tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) return false
    const data = await res.json()
    if (typeof window !== "undefined") {
      localStorage.setItem("hm_token", data.access_token)
    }
    return true
  } catch {
    return false
  }
}
