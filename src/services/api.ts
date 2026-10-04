const fallbackApiUrl = 'http://localhost:3000'

export const apiBaseUrl = import.meta.env.VITE_API_URL || fallbackApiUrl

export function createApiUrl(path: string): URL {
  return new URL(path, apiBaseUrl)
}
