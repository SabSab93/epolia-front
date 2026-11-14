import type { AuthUserType } from '@/domains/auth/models/types/authUser.type'

export interface AuthSessionDto {
  user: AuthUserType & { status: 'ACTIVE' }
  accessToken: string
}
