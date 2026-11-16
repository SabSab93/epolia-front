import type { AuthUserType } from '@/domains/auth/models/types/authUser.type'

export interface AuthSessionDto {
  user: AuthUserType & { status: 'ACTIVE' }
  accessToken: string
  /** Only sent by registration: whether the e-mail with the 6-digit code was accepted for sending. */
  emailVerificationSent?: boolean
}
