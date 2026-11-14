import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseAccountRole } from '@/domains/auth/accountRole'
import type { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'

export function useAccountRoleSelection() {
  const route = useRoute()
  const router = useRouter()
  const selectedRole = computed(() => parseAccountRole(route.query.role))

  function selectRole(role: AccountRoleEnum) {
    return router.replace({ query: { ...route.query, role } })
  }

  function continueToRegistration() {
    const role = selectedRole.value
    if (!role) return

    return router.push({ name: 'register', query: { role } })
  }

  return { selectedRole, selectRole, continueToRegistration }
}
