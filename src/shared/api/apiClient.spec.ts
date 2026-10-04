import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiBaseUrl, apiFetch } from '@/shared/api/apiClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('uses the API base URL and preserves request options and headers', async () => {
    const response = new Response('{"ok":true}', { status: 200 })
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    const options = {
      method: 'POST',
      body: '{"name":"Epolia"}',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer example' },
    }

    expect(await apiFetch('/example', options)).toBe(response)
    const [url, request] = fetchMock.mock.calls[0]!
    expect(url.href).toBe(new URL('/example', apiBaseUrl).href)
    expect(request).toMatchObject({
      method: options.method,
      body: options.body,
      signal: options.signal,
    })
    expect(request.headers.get('Accept')).toBe('application/json')
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(request.headers.get('Authorization')).toBe('Bearer example')
  })

  it('preserves an explicit Accept header and supports empty responses', async () => {
    const response = new Response(null, { status: 204 })
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)

    expect(await apiFetch('/example', { headers: { Accept: 'text/plain' } })).toBe(response)
    expect(fetchMock.mock.calls[0]![1].headers.get('Accept')).toBe('text/plain')
  })

  it('rejects unsuccessful HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 403, statusText: 'Forbidden' })),
    )

    await expect(apiFetch('/example')).rejects.toThrow('HTTP 403: Forbidden')
  })

  it('propagates network failures', async () => {
    const error = new TypeError('Failed to fetch')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error))

    await expect(apiFetch('/example')).rejects.toBe(error)
  })
})
