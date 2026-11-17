import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  KeychainAccess: { whenUnlockedThisDeviceOnly: 1 },
  SecureStorage: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('session token storage', () => {
  it('uses device-only secure storage without iCloud synchronization on native platforms', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    vi.mocked(SecureStorage.get).mockResolvedValue('native-test-token')
    await writeAccessToken('native-test-token')
    expect(await readAccessToken()).toBe('native-test-token')
    await writeAccessToken(null)

    expect(SecureStorage.set).toHaveBeenCalledWith(
      'epolia.access-token',
      'native-test-token',
      false,
      false,
      KeychainAccess.whenUnlockedThisDeviceOnly,
    )
    expect(SecureStorage.get).toHaveBeenCalledWith('epolia.access-token', false, false)
    expect(SecureStorage.remove).toHaveBeenCalledWith('epolia.access-token', false)
    expect(sessionStorage.length).toBe(0)
  })

  it.each([true, false])(
    'keeps the web session in the browser session storage only (DEV=%s)',
    async (dev) => {
      vi.stubEnv('DEV', dev)
      await writeAccessToken('web-test-token')
      expect(await readAccessToken()).toBe('web-test-token')
      expect(localStorage.length).toBe(0)
      expect(SecureStorage.set).not.toHaveBeenCalled()
      await writeAccessToken(null)
      expect(await readAccessToken()).toBeNull()
      expect(sessionStorage.length).toBe(0)
    },
  )
})
