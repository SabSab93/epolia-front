import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  activateRole as activateRoleRequest,
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
  requestVerificationCode,
  verifyEmailCode as verifyEmailCodeRequest,
} from '@/domains/auth/api/authApi'
import type { LoginInputDto } from '@/domains/auth/models/dtos/loginInput.dto'
import type { RegisterInputDto } from '@/domains/auth/models/dtos/registerInput.dto'
import type { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import type { AuthUserType } from '@/domains/auth/models/types/authUser.type'
import type { SessionClearReasonType } from '@/domains/auth/models/types/sessionClearReason.type'
import type { SessionStatusType } from '@/domains/auth/models/types/sessionStatus.type'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { ApiError } from '@/shared/api/apiClient'

// One rule for every account request: 401 ends the session, and a 403 means the account
// can no longer use it. A locked e-mail verification is a 403 too, but the session stays valid.
function sessionEndReason(error: unknown): SessionClearReasonType | undefined {
  if (!(error instanceof ApiError)) return undefined
  if (error.status === 401) return 'expired'
  if (error.status === 403 && error.code !== 'EMAIL_VERIFICATION_LOCKED') return 'forbidden'
  return undefined
}

function ensureNotAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Authentication cancelled', 'AbortError')
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserType | null>(null)
  const status = ref<SessionStatusType>('idle')
  const removalFailed = ref(false)
  const persistenceFailed = ref(false)
  // Result of the last confirmation e-mail request; undefined when unknown (e.g. after login).
  const verificationEmailSent = ref<boolean>()
  const isAuthenticated = computed(() => user.value !== null)

  // Keep only the confirmed user in shared reactive state. The token stays private.
  let accessToken: string | null = null
  let storageRead = false
  let storageQueue = Promise.resolve()
  const restoration = shallowRef<{ controller: AbortController; result: Promise<void> }>()
  const isRestoring = computed(() => restoration.value !== undefined)
  let credentials: AbortController | undefined
  let sessionWrite: Promise<void> | undefined

  function persistToken(token: string | null) {
    // A logout queued during a native write must remove what that write just saved.
    const write = storageQueue.then(() => writeAccessToken(token))
    storageQueue = write.catch(() => {})
    return write
  }

  function cancelRestoration() {
    restoration.value?.controller.abort()
    restoration.value = undefined
  }

  function clearSession(reason: SessionClearReasonType) {
    cancelRestoration()
    accessToken = null
    storageRead = true
    user.value = null
    persistenceFailed.value = false
    verificationEmailSent.value = undefined
    status.value = reason
    return persistToken(null).then(
      () => {
        removalFailed.value = false
      },
      () => {
        removalFailed.value = true
      },
    )
  }

  async function verifySession(signal: AbortSignal) {
    try {
      if (!storageRead) {
        const storedToken = await readAccessToken()
        if (signal.aborted) return
        accessToken = storedToken
        storageRead = true
      }

      if (!accessToken) {
        if (status.value === 'idle' || status.value === 'unavailable') {
          status.value = 'anonymous'
        }
        return
      }

      const verifiedUser = await fetchCurrentUser(accessToken, signal)
      if (signal.aborted) return
      user.value = verifiedUser
      status.value = 'authenticated'
    } catch (error) {
      if (signal.aborted) return

      const reason = sessionEndReason(error)
      if (reason) {
        await clearSession(reason)
      } else if (user.value) {
        // A session the server already confirmed in this run stays usable during a network
        // failure (e.g. right after registration): the next request reports an invalid token.
        status.value = 'authenticated'
      } else {
        status.value = 'unavailable'
      }
    }
  }

  async function restore() {
    // Wait for the new session rather than validating the token it replaces.
    if (sessionWrite) await sessionWrite
    if (restoration.value) return restoration.value.result

    const controller = new AbortController()
    const result = verifySession(controller.signal).finally(() => {
      if (restoration.value?.controller === controller) restoration.value = undefined
    })
    restoration.value = { controller, result }
    return result
  }

  async function authenticate(request: (signal: AbortSignal) => ReturnType<typeof loginRequest>) {
    if (credentials) throw new Error('Authentication already in progress')

    const controller = new AbortController()
    credentials = controller
    try {
      const session = await request(controller.signal)
      ensureNotAborted(controller.signal)

      cancelRestoration()
      const write = persistToken(session.accessToken)
        .then(
          () => true,
          () => false,
        )
        .then(async (saved) => {
          ensureNotAborted(controller.signal)
          if (!saved) {
            // Avoid restoring a previous account after a failed token replacement.
            const removed = await persistToken(null).then(
              () => true,
              () => false,
            )
            ensureNotAborted(controller.signal)
            removalFailed.value = !removed
          } else {
            removalFailed.value = false
          }
          accessToken = session.accessToken
          storageRead = true
          user.value = session.user
          verificationEmailSent.value = session.emailVerificationSent
          status.value = 'authenticated'
          persistenceFailed.value = !saved
        })
      sessionWrite = write.catch(() => {})
      await write
      return session.user
    } finally {
      if (credentials === controller) {
        credentials = undefined
        sessionWrite = undefined
      }
    }
  }

  function login(input: LoginInputDto) {
    return authenticate((signal) => loginRequest(input, signal))
  }

  function register(input: RegisterInputDto) {
    return authenticate((signal) => registerRequest(input, signal))
  }

  function activateRole(role: AccountRoleEnum) {
    const token = accessToken
    if (!token) throw new Error('Authentication required')

    return authenticate(async (signal) => {
      try {
        return await activateRoleRequest(role, token, signal)
      } catch (error) {
        // Narrower than sessionEndReason: a role can be refused (e.g. ADULT_REQUIRED) while the
        // session stays valid, so only an inactive account ends it.
        if (!signal.aborted && error instanceof ApiError) {
          if (error.status === 401) await clearSession('expired')
          if (error.code === 'ACCOUNT_NOT_ACTIVE') await clearSession('forbidden')
        }
        throw error
      }
    })
  }

  async function handleSessionError(error: unknown) {
    const reason = sessionEndReason(error)
    if (reason) await clearSession(reason)
  }

  // Reads the account again without signing out on a network error.
  async function refreshUser() {
    const token = accessToken
    if (!token) throw new Error('Authentication required')
    try {
      const freshUser = await fetchCurrentUser(token)
      if (accessToken === token) user.value = freshUser
    } catch (error) {
      await handleSessionError(error)
      throw error
    }
  }

  async function resendVerificationCode() {
    const token = accessToken
    if (!token) throw new Error('Authentication required')
    try {
      await requestVerificationCode(token)
      if (accessToken === token) verificationEmailSent.value = true
    } catch (error) {
      await handleSessionError(error)
      throw error
    }
  }

  async function verifyEmailCode(code: string) {
    const token = accessToken
    if (!token) throw new Error('Authentication required')
    let confirmed: boolean
    try {
      confirmed = await verifyEmailCodeRequest(code, token)
    } catch (error) {
      await handleSessionError(error)
      throw error
    }
    // The server answer is the saved state: show it even if the account cannot be read again.
    if (confirmed && accessToken === token && user.value) {
      user.value = { ...user.value, emailVerified: true }
    }
    // Then read the whole account again; a network failure here does not undo the confirmation.
    await refreshUser().catch(() => {})
  }

  function logout() {
    credentials?.abort()
    credentials = undefined
    sessionWrite = undefined
    return clearSession('anonymous')
  }

  return {
    user,
    status,
    removalFailed,
    persistenceFailed,
    verificationEmailSent,
    isAuthenticated,
    isRestoring,
    restore,
    login,
    register,
    activateRole,
    refreshUser,
    resendVerificationCode,
    verifyEmailCode,
    logout,
  }
})
