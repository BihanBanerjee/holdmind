const BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

let _refreshPromise: Promise<boolean> | null = null

let _onTokenRefreshed: ((token: string) => void) | null = null

export function setTokenRefreshedCallback(cb: (token: string) => void): void {
  _onTokenRefreshed = cb
}

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

async function _doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) return false
    const data = await res.json()
    const token = data?.access_token
    if (!token || typeof token !== "string") return false
    if (typeof window !== "undefined") {
      localStorage.setItem("hm_token", token)
      _onTokenRefreshed?.(token)
    }
    return true
  } catch {
    return false
  }
}

function _tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null
  })
  return _refreshPromise
}
