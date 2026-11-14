import { computed, ref } from 'vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { ApiError } from '@/shared/api/apiClient'

export function useAdditionalRoleRegistration(getRole: () => AccountRoleEnum) {
  const auth = useAuthStore()
  const isStudent = computed(() => getRole() === AccountRoleEnum.Student)
  const title = computed(() =>
    isStudent.value ? 'Inscription comme étudiant' : 'Inscription comme particulier',
  )
  const description = computed(() =>
    isStudent.value
      ? 'Ajoutez le rôle étudiant à votre compte pour pouvoir proposer vos services sur Epolia.'
      : 'Ajoutez le rôle particulier à votre compte pour pouvoir rechercher un étudiant pour une mission.',
  )
  const hasRole = computed(() => auth.user?.roles.includes(getRole()))
  const successMessage = computed(() =>
    isStudent.value
      ? 'Le rôle étudiant est actif sur votre compte.'
      : 'Le rôle particulier est actif sur votre compte.',
  )
  const isSubmitting = ref(false)
  const errorMessage = ref('')

  async function confirmRole() {
    if (isSubmitting.value || hasRole.value) return

    isSubmitting.value = true
    errorMessage.value = ''
    try {
      await auth.activateRole(getRole())
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ADULT_REQUIRED') {
        errorMessage.value = 'Vous devez avoir au moins 18 ans pour ajouter ce rôle.'
      } else if (error instanceof ApiError && error.code === 'BIRTH_DATE_REQUIRED') {
        errorMessage.value = 'Votre date de naissance doit être renseignée pour ajouter ce rôle.'
      } else {
        errorMessage.value = 'Ce rôle n’a pas pu être ajouté. Réessayez.'
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return { title, description, hasRole, successMessage, isSubmitting, errorMessage, confirmRole }
}
