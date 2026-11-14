import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'

export function parseAccountRole(value: unknown): AccountRoleEnum | undefined {
  return value === AccountRoleEnum.Customer || value === AccountRoleEnum.Student ? value : undefined
}
