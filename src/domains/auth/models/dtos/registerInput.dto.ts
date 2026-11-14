import type { LoginInputDto } from '@/domains/auth/models/dtos/loginInput.dto'
import type { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'

export interface RegisterInputDto extends LoginInputDto {
  role: AccountRoleEnum
  firstName: string
  lastName: string
  birthDate: string
  termsAccepted: boolean
  termsVersion: string
}
