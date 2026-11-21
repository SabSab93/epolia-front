import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { deferred } from '@/tests/deferred'

vi.mock('@/domains/auth/stores/sessionStorage', () => ({
  readAccessToken: vi.fn(),
  writeAccessToken: vi.fn(),
}))

const user = {
  id: 'user-id',
  email: 'test@example.com',
  emailVerified: false,
  roles: [AccountRoleEnum.Student],
}
const loginInput = { email: user.email, password: 'test-password' }
const registerInput = {
  ...loginInput,
  role: AccountRoleEnum.Student,
  firstName: 'Camille',
  lastName: 'Exemple',
  birthDate: '2000-01-01',
  termsAccepted: true,
  termsVersion: 'test-v1',
}
const signedIn = { user: { ...user, status: 'ACTIVE' }, accessToken: 'test-token' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(readAccessToken).mockResolvedValue(null)
  vi.mocked(writeAccessToken).mockResolvedValue()
})

afterEach(() => vi.unstubAllGlobals())

describe('auth session', () => {
  it('shares the server session returned by both registration and login', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(signedIn, 201))
      .mockResolvedValueOnce(json(signedIn))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())

    await auth.register(registerInput)
    expect(auth.user).toEqual(signedIn.user)
    await auth.logout()
    await auth.login(loginInput)

    expect(auth.user).toEqual(signedIn.user)
    expect(auth.isAuthenticated).toBe(true)
    expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/api/auth/register',
      '/api/auth/login',
    ])
    expect(fetchMock.mock.calls.map(([, options]) => JSON.parse(String(options?.body)))).toEqual([
      registerInput,
      loginInput,
    ])
    expect(vi.mocked(writeAccessToken).mock.calls).toEqual([['test-token'], [null], ['test-token']])
  })

  it('checks the stored token once when startup and private navigation restore together', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('restored-token')
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(json(user))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())

    const verification = auth.restore()
    expect(auth.isAuthenticated).toBe(false)
    await Promise.all([verification, auth.restore()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(new URL(String(url)).pathname).toBe('/api/auth/me')
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer restored-token')
    expect(auth.user).toEqual(user)
  })

  it.each([
    [401, 'expired'],
    [403, 'forbidden'],
  ])('removes a stored session on HTTP %i', async (status, result) => {
    vi.mocked(readAccessToken).mockResolvedValue('restored-token')
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ code: 'TEST' }, status))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())

    await auth.restore()
    await auth.restore()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(auth.status).toBe(result)
    expect(auth.user).toBeNull()
    expect(writeAccessToken).toHaveBeenCalledWith(null)
  })

  it('retains the token for retry when the API is unavailable or returns invalid data', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('restored-token')
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockRejectedValueOnce(new TypeError('Network offline'))
        .mockResolvedValueOnce(json({ ...user, roles: ['UNKNOWN'] }))
        .mockResolvedValueOnce(json(user)),
    )
    const auth = useAuthStore(createPinia())

    await auth.restore()
    expect(auth.status).toBe('unavailable')
    await auth.restore()
    expect(auth.status).toBe('unavailable')
    expect(auth.user).toBeNull()
    expect(writeAccessToken).not.toHaveBeenCalled()

    await auth.restore()
    expect(auth.user).toEqual(user)
  })

  it.each([
    { status: 401, code: 'UNAUTHORIZED', reason: 'expired' },
    { status: 403, code: 'ACCOUNT_NOT_ACTIVE', reason: 'forbidden' },
  ])(
    'keeps the session $reason after a stale verification during role activation',
    async ({ status, code, reason }) => {
      const verification = deferred<Response>()
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json(signedIn))
        .mockReturnValueOnce(verification.promise)
        .mockResolvedValueOnce(json({ code }, status))
      vi.stubGlobal('fetch', fetchMock)
      const auth = useAuthStore(createPinia())
      await auth.login(loginInput)

      const restoration = auth.restore()
      await expect(auth.activateRole(AccountRoleEnum.Customer)).rejects.toMatchObject({ status })
      expect(writeAccessToken).toHaveBeenLastCalledWith(null)

      verification.resolve(json(user))
      await restoration
      expect(auth.status).toBe(reason)
      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
    },
  )

  it('returns to the anonymous state when a retry finds an empty storage', async () => {
    vi.mocked(readAccessToken).mockRejectedValueOnce(new Error('Storage unavailable'))
    const auth = useAuthStore(createPinia())

    await auth.restore()
    expect(auth.status).toBe('unavailable')
    await auth.restore()

    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
  })

  it('keeps a successful registration in memory when saving the token fails', async () => {
    vi.mocked(writeAccessToken).mockRejectedValueOnce(new Error('Storage unavailable'))
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json(signedIn, 201))
        .mockResolvedValueOnce(json(user)),
    )
    const auth = useAuthStore(createPinia())

    await expect(auth.register(registerInput)).resolves.toEqual(signedIn.user)
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.persistenceFailed).toBe(true)
    expect(vi.mocked(writeAccessToken).mock.calls).toEqual([['test-token'], [null]])

    await auth.restore()
    expect(auth.user).toEqual(user)
    await auth.logout()
    expect(auth.persistenceFailed).toBe(false)
  })

  it('rejects an invalid success response without persisting a token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValueOnce(json({ ...signedIn, accessToken: null })),
    )
    const auth = useAuthStore(createPinia())

    await expect(auth.login(loginInput)).rejects.toThrow('Unexpected authentication response')
    expect(auth.user).toBeNull()
    expect(writeAccessToken).not.toHaveBeenCalled()
  })

  it('cancels restoration on logout and ignores an API response that arrives anyway', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('restored-token')
    const reply = deferred<Response>()
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(reply.promise)
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())
    const restoration = auth.restore()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())

    await auth.logout()
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    reply.resolve(json(user))
    await restoration

    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(writeAccessToken).toHaveBeenCalledWith(null)
  })

  it('does not restore the session again when local token removal fails', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    vi.mocked(writeAccessToken).mockRejectedValueOnce(new Error('Storage unavailable'))
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(json(user))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())

    await auth.restore()
    expect(auth.user).toEqual(user)
    await auth.logout()
    await auth.restore()

    expect(auth.user).toBeNull()
    expect(auth.removalFailed).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await auth.logout()
    expect(auth.removalFailed).toBe(false)
  })

  it('verifies the new token if navigation starts during a storage write', async () => {
    const write = deferred<void>()
    vi.mocked(writeAccessToken).mockReturnValueOnce(write.promise)
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(signedIn))
      .mockResolvedValueOnce(json(user))
    vi.stubGlobal('fetch', fetchMock)
    const auth = useAuthStore(createPinia())
    const login = auth.login(loginInput)
    await vi.waitFor(() => expect(writeAccessToken).toHaveBeenCalledWith('test-token'))

    const verification = auth.restore()
    write.resolve()
    await Promise.all([login, verification])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer test-token',
    )
    expect(auth.user).toEqual(user)
  })

  it('removes a token whose native write was in progress when the user logged out', async () => {
    const write = deferred<void>()
    vi.mocked(writeAccessToken).mockReturnValueOnce(write.promise)
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValueOnce(json(signedIn)))
    const auth = useAuthStore(createPinia())
    const login = auth.login(loginInput)
    const abortedLogin = expect(login).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(writeAccessToken).toHaveBeenCalledWith('test-token'))

    const logout = auth.logout()
    expect(auth.user).toBeNull()
    write.resolve()
    await logout
    await abortedLogin

    expect(vi.mocked(writeAccessToken).mock.calls).toEqual([['test-token'], [null]])
    expect(auth.user).toBeNull()
  })
})
