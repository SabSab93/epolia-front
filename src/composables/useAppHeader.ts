import type { AccountMenuLinkTypes } from '@/domains/auth/models/types/accountMenuLink.type'
import { computed } from 'vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { firstStudentStepDestination } from '@/domains/onboarding/studentSteps'

export function useAppHeader() {
  const auth = useAuthStore()
  const links = computed(() => {
    const user = auth.user
    const links: AccountMenuLinkTypes[] = []
    if (!user) return links

    const student = user.roles.includes(AccountRoleEnum.Student)
    const customer = user.roles.includes(AccountRoleEnum.Customer)
    if (student) {
      links.push({ label: 'Mon parcours étudiant', to: firstStudentStepDestination() })
      if (import.meta.env.DEV) {
        links.push({
          label: 'Refaire le parcours étudiant (dev)',
          to: { ...firstStudentStepDestination(), query: { recommencer: '1' } },
        })
      }
      if (!user.emailVerified) {
        links.push({ label: 'Confirmer mon adresse e-mail', to: { name: 'email-verification' } })
      }
    }
    if (student !== customer) {
      const role = student ? AccountRoleEnum.Customer : AccountRoleEnum.Student
      links.push({
        label: student ? 'M’inscrire comme particulier' : 'M’inscrire comme étudiant',
        to: { name: 'additional-role', params: { role } },
      })
    }
    return links
  })

  return { links }
}
