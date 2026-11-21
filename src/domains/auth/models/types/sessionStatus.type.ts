import type { SessionClearReasonType } from '@/domains/auth/models/types/sessionClearReason.type'

export type SessionStatusType = SessionClearReasonType | 'idle' | 'authenticated' | 'unavailable'
