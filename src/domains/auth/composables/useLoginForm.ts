import { computed, ref, watch } from 'vue'
import { useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { ApiError } from '@/shared/api/apiClient'

export function useLoginForm() {
  const auth = useAuthStore()
  const router = useRouter()
  const email = ref('')
  const password = ref('')
  const emailError = ref('')
  const passwordError = ref('')
  const formError = ref('')
  const submitting = ref(false)

  watch(email, () => {
    emailError.value = ''
    formError.value = ''
  })
  watch(password, () => {
    passwordError.value = ''
    formError.value = ''
  })
  const sessionMessage = computed(() => {
    switch (auth.status) {
      case 'expired':
        return 'Votre session a expiré. Connectez-vous de nouveau.'
      case 'forbidden':
        return 'L’accès à votre session a été refusé.'
      case 'unavailable':
        return 'Impossible de vérifier la session. Réessayez.'
      default:
        return ''
    }
  })

  async function submit() {
    if (submitting.value || auth.isRestoring || auth.removalFailed) return

    const address = email.value.trim()
    formError.value = ''
    emailError.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
      ? ''
      : 'Vérifiez votre adresse e-mail.'
    passwordError.value = password.value ? '' : 'Indiquez votre mot de passe.'
    if (emailError.value) return 'email'
    if (passwordError.value) return 'password'

    const origin = router.currentRoute.value
    submitting.value = true
    try {
      await auth.login({ email: address, password: password.value })
      password.value = ''
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        formError.value = 'Adresse e-mail ou mot de passe incorrect.'
      } else if (error instanceof ApiError && error.status === 403) {
        formError.value = 'La connexion à ce compte est indisponible.'
      } else if (error instanceof TypeError) {
        formError.value = 'Vérifiez votre connexion Internet, puis réessayez.'
      } else {
        formError.value = 'Connexion impossible pour le moment. Réessayez.'
      }
      return
    } finally {
      submitting.value = false
    }

    await continueToSession(origin)
  }

  async function retrySession() {
    const origin = router.currentRoute.value
    formError.value = ''
    await auth.restore()
    await continueToSession(origin)
  }

  async function continueToSession(origin: RouteLocationNormalizedLoaded) {
    if (router.currentRoute.value !== origin || !auth.isAuthenticated) return

    const destination = origin.redirectedFrom
    if (destination?.matched.some(({ meta }) => meta.requiresAuth)) {
      await router.replace(destination.fullPath)
      return
    }

    await router.replace({ name: 'home' })
  }

  return {
    auth,
    email,
    password,
    emailError,
    passwordError,
    formError,
    submitting,
    sessionMessage,
    submit,
    retrySession,
  }
}
