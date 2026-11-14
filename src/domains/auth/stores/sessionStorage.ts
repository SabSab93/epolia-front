import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'

const tokenKey = 'epolia.access-token'

export async function readAccessToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const value = await SecureStorage.get(tokenKey, false, false)
    return typeof value === 'string' ? value : null
  }

  return import.meta.env.DEV ? sessionStorage.getItem(tokenKey) : null
}

export async function writeAccessToken(accessToken: string | null): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    if (accessToken === null) {
      await SecureStorage.remove(tokenKey, false)
    } else {
      await SecureStorage.set(
        tokenKey,
        accessToken,
        false,
        false,
        KeychainAccess.whenUnlockedThisDeviceOnly,
      )
    }
    return
  }

  if (import.meta.env.DEV) {
    if (accessToken === null) {
      sessionStorage.removeItem(tokenKey)
    } else {
      sessionStorage.setItem(tokenKey, accessToken)
    }
  }
}
