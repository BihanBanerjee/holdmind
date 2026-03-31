// frontend/__tests__/utils.tsx
import React from "react"
import { render, renderHook, type RenderOptions } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/** Fresh QueryClient with retries disabled to keep tests fast. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

/** Render a React element inside a QueryClientProvider. */
export function renderWithQuery(
  ui: React.ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient },
) {
  const qc = options?.queryClient ?? makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
    options,
  )
}

/** renderHook wrapped in a QueryClientProvider. */
export function renderHookWithQuery<R>(
  hook: () => R,
  queryClient?: QueryClient,
) {
  const qc = queryClient ?? makeQueryClient()
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  })
}
