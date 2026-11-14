const fallbackApiUrl = 'http://localhost:3000'

export const apiBaseUrl = import.meta.env.VITE_API_URL || fallbackApiUrl

export function createApiUrl(path: string): URL {
  return new URL(path, apiBaseUrl)
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
    readonly code?: string,
  ) {
    super(`HTTP ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(createApiUrl(path), { ...options, headers })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const code =
      body && typeof body === 'object' && 'code' in body && typeof body.code === 'string'
        ? body.code
        : undefined
    throw new ApiError(response.status, response.statusText, code)
  }

  return response
}
