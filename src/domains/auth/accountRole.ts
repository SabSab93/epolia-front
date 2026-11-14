import { AccountRole } from '@/domains/auth/models/enums/AccountRole'

export function parseAccountRole(value: unknown): AccountRole | undefined {
  return value === AccountRole.Customer || value === AccountRole.Student ? value : undefined
}
