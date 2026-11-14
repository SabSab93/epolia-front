import type { UserRoleType } from '@/domains/auth/models/types/userRole.type'

export interface AuthUserType {
  id: string
  email: string | null
  roles: UserRoleType[]
}
