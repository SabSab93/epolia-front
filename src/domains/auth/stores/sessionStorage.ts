import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'

const tokenKey = 'epolia.access-token'

export async function readAccessToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const value = await SecureStorage.get(tokenKey, false, false)
    return typeof value === 'string' ? value : null
  }

  // Web build: sessionStorage keeps the session across reloads of the tab and
  // forgets it when the tab closes. Never localStorage, which outlives the tab.
  return sessionStorage.getItem(tokenKey)
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

  if (accessToken === null) {
    sessionStorage.removeItem(tokenKey)
  } else {
    sessionStorage.setItem(tokenKey, accessToken)
  }
}
