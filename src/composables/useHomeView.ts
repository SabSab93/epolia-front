import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/authStore'

export function useHomeView() {
  const router = useRouter()
  const auth = useAuthStore()
  const content = useTemplateRef<HTMLElement>('content')
  const signingOut = ref(false)
  const signedOut = ref(false)
  const checkingSession = computed(() => auth.isRestoring && auth.status !== 'unavailable')

  onMounted(() => content.value?.focus())

  async function retrySession() {
    await auth.restore()
    if (auth.status !== 'unavailable') {
      await nextTick()
      content.value?.focus()
    }
  }

  async function signOut() {
    signingOut.value = true
    signedOut.value = false
    await auth.logout()
    signingOut.value = false
    signedOut.value = !auth.removalFailed
    await nextTick()
    content.value?.focus()
  }

  function openRegistration() {
    return router.push({ name: 'choose-role' })
  }

  function openLogin() {
    return router.push({ name: 'login' })
  }

  return {
    auth,
    checkingSession,
    signingOut,
    signedOut,
    retrySession,
    signOut,
    openRegistration,
    openLogin,
  }
}
