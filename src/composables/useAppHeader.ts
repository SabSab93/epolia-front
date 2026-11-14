import { computed } from 'vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'

export function useAppHeader() {
  const auth = useAuthStore()
  const availableRole = computed(() => {
    const roles = auth.user?.roles
    const hasStudent = roles?.includes(AccountRoleEnum.Student)
    const hasCustomer = roles?.includes(AccountRoleEnum.Customer)

    if (hasStudent && !hasCustomer) return AccountRoleEnum.Customer
    if (hasCustomer && !hasStudent) return AccountRoleEnum.Student
    return undefined
  })

  return { availableRole }
}
