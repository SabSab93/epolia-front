const fallbackApiUrl = 'http://localhost:3000'

export const apiBaseUrl = import.meta.env.VITE_API_URL || fallbackApiUrl

export function createApiUrl(path: string): URL {
  return new URL(path, apiBaseUrl)
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(createApiUrl(path), { ...options, headers })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response
}
