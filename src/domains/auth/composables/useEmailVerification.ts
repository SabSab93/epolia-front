import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { ApiError } from '@/shared/api/apiClient'
import BaseCodeInput, { codeLength } from '@/shared/components/BaseCodeInput.vue'

// Same delay as the server: a new code cannot be requested within a minute.
const resendDelaySeconds = 60

function remainingAttempts(error: ApiError) {
  const body = error.body
  if (typeof body !== 'object' || body === null || !('attemptsRemaining' in body)) return undefined
  const attempts = body.attemptsRemaining
  return typeof attempts === 'number' && Number.isInteger(attempts) && attempts >= 0
    ? attempts
    : undefined
}

function incorrectCodeMessage(error: ApiError) {
  const attempts = remainingAttempts(error)
  const base = 'Code incorrect. Vérifiez les chiffres saisis ou demandez un nouveau code.'
  if (attempts === undefined) return base
  return `${base} Il vous reste ${attempts} essai${attempts > 1 ? 's' : ''}.`
}

function resendErrorMessage(error: unknown) {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'EMAIL_VERIFICATION_RATE_LIMITED':
      return 'Trop de demandes d’envoi. Réessayez plus tard.'
    case 'EMAIL_SERVICE_UNAVAILABLE':
    case 'EMAIL_SEND_FAILED':
      return 'L’envoi de l’e-mail est indisponible pour le moment. Réessayez plus tard.'
    case 'EMAIL_VERIFICATION_LOCKED':
      return 'Trop de codes incorrects ont été saisis sur ce compte : nous ne pouvons plus vous envoyer de code. Contactez l’équipe Epolia pour débloquer votre compte.'
    case 'EMAIL_REQUIRED':
      return 'Aucune adresse e-mail n’est associée à ce compte.'
    default:
      return 'Envoi non confirmé. Vérifiez votre connexion, puis réessayez.'
  }
}

export function useEmailVerification() {
  const router = useRouter()
  const auth = useAuthStore()
  const verified = computed(() => auth.user?.emailVerified === true)
  const code = ref('')
  const codeError = ref('')
  // Set when the code can no longer be used: a new one must be requested.
  const blockedMessage = ref('')
  const formError = ref('')
  const verifying = ref(false)
  const sending = ref(false)
  const resendMessage = ref('')
  const resendFailed = ref(false)
  // No new code can be sent to this account any more: only the Epolia team can unlock it.
  const locked = ref(false)
  const secondsLeft = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  const canVerify = computed(
    () => code.value.length === codeLength && !verifying.value && !blockedMessage.value,
  )
  const countdown = computed(() => {
    const minutes = Math.floor(secondsLeft.value / 60)
    const seconds = String(secondsLeft.value % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  // Typing again clears the previous error.
  watch(code, () => {
    codeError.value = ''
    formError.value = ''
  })

  function startCooldown() {
    clearInterval(timer)
    secondsLeft.value = resendDelaySeconds
    timer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) clearInterval(timer)
    }, 1000)
  }

  // A code was just sent at registration: the server refuses another one for a minute.
  if (auth.verificationEmailSent) startCooldown()
  onBeforeUnmount(() => clearInterval(timer))

  async function verify() {
    if (!canVerify.value) return
    verifying.value = true
    codeError.value = ''
    formError.value = ''
    try {
      await auth.verifyEmailCode(code.value)
    } catch (error) {
      // Without a session, the view sends the person back to the login page.
      if (!auth.isAuthenticated) return
      const apiCode = error instanceof ApiError ? error.code : undefined
      if (error instanceof ApiError && apiCode === 'EMAIL_VERIFICATION_CODE_INVALID') {
        codeError.value = incorrectCodeMessage(error)
      } else if (apiCode === 'EMAIL_VERIFICATION_CODE_EXPIRED') {
        code.value = ''
        blockedMessage.value =
          'Ce code a expiré : les codes ne sont valables que 10 minutes. Demandez-en un nouveau pour continuer.'
      } else if (apiCode === 'EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS') {
        code.value = ''
        blockedMessage.value = 'Trop d’essais avec ce code. Demandez-en un nouveau pour continuer.'
      } else if (apiCode === 'EMAIL_ALREADY_VERIFIED') {
        await auth.refreshUser().catch(() => {})
      } else {
        formError.value = 'Vérification non confirmée. Vérifiez votre connexion, puis réessayez.'
      }
    } finally {
      verifying.value = false
    }
  }

  async function resend() {
    if (sending.value || secondsLeft.value > 0 || locked.value) return false
    sending.value = true
    resendMessage.value = ''
    resendFailed.value = false
    try {
      await auth.resendVerificationCode()
      code.value = ''
      codeError.value = ''
      blockedMessage.value = ''
      resendMessage.value = `Nouveau code envoyé à ${auth.user?.email ?? 'votre adresse'}. Seul le dernier code reçu fonctionne.`
      startCooldown()
      return true
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_VERIFIED') {
        // Confirmed in the meantime: show the state saved by the server.
        await auth.refreshUser().catch(() => {})
      } else if (auth.isAuthenticated) {
        const apiCode = error instanceof ApiError ? error.code : undefined
        locked.value = apiCode === 'EMAIL_VERIFICATION_LOCKED'
        resendFailed.value = true
        resendMessage.value = resendErrorMessage(error)
        // A code was sent less than a minute ago (e.g. before a reload): show the wait.
        if (apiCode === 'EMAIL_VERIFICATION_RATE_LIMITED') startCooldown()
      }
      return false
    } finally {
      sending.value = false
    }
  }

  const email = computed(() => auth.user?.email ?? '')
  const codeInput = useTemplateRef<InstanceType<typeof BaseCodeInput>>('codeInput')

  async function requestNewCode() {
    if (!(await resend())) return
    await nextTick()
    codeInput.value?.focus()
  }

  function openOnboarding() {
    return router.push({ name: 'student-onboarding' })
  }

  // An incorrect code: return to the field so the person can correct it.
  watch(codeError, async (message) => {
    if (!message) return
    await nextTick()
    codeInput.value?.focus()
  })

  // Confirmed by the server: nothing left to do on this page.
  watch(
    verified,
    (isVerified) => {
      if (isVerified) {
        const student = auth.user?.roles.includes(AccountRoleEnum.Student)
        router.replace({ name: student ? 'student-onboarding' : 'home' })
      }
    },
    { immediate: true },
  )

  // An expired session cannot verify a code: the login page explains why.
  watch(
    () => auth.isAuthenticated,
    (isAuthenticated) => {
      if (!isAuthenticated) router.replace({ name: 'login' })
    },
  )

  return {
    auth,
    email,
    openOnboarding,
    code,
    codeError,
    blockedMessage,
    formError,
    verifying,
    canVerify,
    sending,
    resendMessage,
    resendFailed,
    locked,
    secondsLeft,
    countdown,
    verify,
    requestNewCode,
  }
}
