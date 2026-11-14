import { parseAccountRole } from '@/domains/auth/accountRole'
import type { AuthSessionDto } from '@/domains/auth/models/dtos/authSession.dto'
import type { LoginInputDto } from '@/domains/auth/models/dtos/loginInput.dto'
import type { RegisterInputDto } from '@/domains/auth/models/dtos/registerInput.dto'
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
    Array.isArray(value.roles) &&
    value.roles.every(isUserRole)
  )
}

async function authenticate(
  path: '/api/auth/login' | '/api/auth/register',
  input: LoginInputDto | RegisterInputDto,
  signal?: AbortSignal,
): Promise<AuthSessionDto> {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    user: { id: data.user.id, email: data.user.email, roles: data.user.roles, status: 'ACTIVE' },
    accessToken: data.accessToken,
  }
}

export function login(input: LoginInputDto, signal?: AbortSignal) {
  return authenticate('/api/auth/login', input, signal)
}

export function register(input: RegisterInputDto, signal?: AbortSignal) {
  return authenticate('/api/auth/register', input, signal)
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

  return { id: data.id, email: data.email, roles: data.roles }
}
