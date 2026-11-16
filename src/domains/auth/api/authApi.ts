import { parseAccountRole } from '@/domains/auth/accountRole'
import type { AuthSessionDto } from '@/domains/auth/models/dtos/authSession.dto'
import type { LoginInputDto } from '@/domains/auth/models/dtos/loginInput.dto'
import type { RegisterInputDto } from '@/domains/auth/models/dtos/registerInput.dto'
import type { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import type { AuthUserType } from '@/domains/auth/models/types/authUser.type'
import type { UserRoleType } from '@/domains/auth/models/types/userRole.type'
import { apiFetch } from '@/shared/api/apiClient'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserRole(value: unknown): value is UserRoleType {
  return value === 'ADMIN' || parseAccountRole(value) !== undefined
}

function isAuthUser(value: unknown): value is AuthUserType {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    (typeof value.email === 'string' || value.email === null) &&
    typeof value.emailVerified === 'boolean' &&
    Array.isArray(value.roles) &&
    value.roles.every(isUserRole)
  )
}

async function authenticate(
  path: '/api/auth/login' | '/api/auth/register' | '/api/auth/roles',
  input: LoginInputDto | RegisterInputDto | { role: AccountRoleEnum },
  signal?: AbortSignal,
  accessToken?: string,
): Promise<AuthSessionDto> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await apiFetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal,
  })
  const data: unknown = await response.json()
  if (
    !isRecord(data) ||
    !isRecord(data.user) ||
    data.user.status !== 'ACTIVE' ||
    !isAuthUser(data.user) ||
    typeof data.accessToken !== 'string' ||
    !data.accessToken.trim()
  ) {
    throw new Error('Unexpected authentication response')
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      emailVerified: data.user.emailVerified,
      roles: data.user.roles,
      status: 'ACTIVE',
    },
    accessToken: data.accessToken,
    emailVerificationSent:
      typeof data.emailVerificationSent === 'boolean' ? data.emailVerificationSent : undefined,
  }
}

export function login(input: LoginInputDto, signal?: AbortSignal) {
  return authenticate('/api/auth/login', input, signal)
}

export function register(input: RegisterInputDto, signal?: AbortSignal) {
  return authenticate('/api/auth/register', input, signal)
}

export function activateRole(role: AccountRoleEnum, accessToken: string, signal?: AbortSignal) {
  return authenticate('/api/auth/roles', { role }, signal, accessToken)
}

export async function fetchCurrentUser(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthUserType> {
  const response = await apiFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
    signal,
  })
  const data: unknown = await response.json()
  if (!isAuthUser(data)) {
    throw new Error('Unexpected current user response')
  }

  return { id: data.id, email: data.email, emailVerified: data.emailVerified, roles: data.roles }
}

/** Accepted by the sending service only: it does not prove the message arrived. */
export async function requestVerificationCode(accessToken: string, signal?: AbortSignal) {
  await apiFetch('/api/auth/email-verification', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
}

/** Checks the 6-digit code received by e-mail. Returns true when the server confirmed the address. */
export async function verifyEmailCode(
  code: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const response = await apiFetch('/api/auth/email-verification/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
    signal,
  })
  const data: unknown = await response.json().catch(() => null)
  return isRecord(data) && data.emailVerified === true
}
