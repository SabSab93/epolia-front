import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '@/domains/auth/api/authApi'
import type { LoginInputDto } from '@/domains/auth/models/dtos/loginInput.dto'
import type { RegisterInputDto } from '@/domains/auth/models/dtos/registerInput.dto'
import type { AuthUserType } from '@/domains/auth/models/types/authUser.type'
import type { SessionStatusType } from '@/domains/auth/models/types/sessionStatus.type'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { ApiError } from '@/shared/api/apiClient'

function ensureNotAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Authentication cancelled', 'AbortError')
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserType | null>(null)
  const status = ref<SessionStatusType>('idle')
  const removalFailed = ref(false)
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

  function clearSession(reason: 'anonymous' | 'expired' | 'forbidden') {
    accessToken = null
    storageRead = true
    user.value = null
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
        if (status.value === 'idle') status.value = 'anonymous'
        return
      }

      const verifiedUser = await fetchCurrentUser(accessToken, signal)
      if (signal.aborted) return
      user.value = verifiedUser
      status.value = 'authenticated'
    } catch (error) {
      if (signal.aborted) return

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await clearSession(error.status === 401 ? 'expired' : 'forbidden')
      } else {
        user.value = null
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

      restoration.value?.controller.abort()
      restoration.value = undefined
      const write = persistToken(session.accessToken).then(() => {
        ensureNotAborted(controller.signal)
        accessToken = session.accessToken
        storageRead = true
        user.value = session.user
        status.value = 'authenticated'
        removalFailed.value = false
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

  function logout() {
    credentials?.abort()
    credentials = undefined
    sessionWrite = undefined
    restoration.value?.controller.abort()
    restoration.value = undefined
    return clearSession('anonymous')
  }

  return {
    user,
    status,
    removalFailed,
    isAuthenticated,
    isRestoring,
    restore,
    login,
    register,
    logout,
  }
})
