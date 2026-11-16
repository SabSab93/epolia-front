<template>
  <AuthLayout title="Vérification" :back-to="{ name: 'home' }" back-label="Retour à l’accueil">
    <form novalidate class="flex flex-col gap-epolia-lg" @submit.prevent="verify">
      <span class="email-verification-icon">
        <BaseIcon :icon="IconMail" />
      </span>

      <div class="flex flex-col gap-epolia-xs">
        <BaseTitle>Vérifiez votre boîte mail</BaseTitle>
        <p v-if="auth.verificationEmailSent === false" class="text-epolia-text-secondary">
          Votre compte est créé, mais le code n’a pas pu être envoyé à
          <span class="text-epolia-text">{{ email }}</span
          >. Demandez un nouveau code.
        </p>
        <p v-else-if="auth.verificationEmailSent" class="text-epolia-text-secondary">
          Nous avons envoyé un code à 6 chiffres à <span class="text-epolia-text">{{ email }}</span
          >.
        </p>
        <p v-else class="text-epolia-text-secondary">
          Saisissez le code à 6 chiffres envoyé à <span class="text-epolia-text">{{ email }}</span
          >.
        </p>
      </div>

      <div class="flex flex-col gap-epolia-xs">
        <BaseCodeInput
          ref="codeInput"
          v-model="code"
          name="code"
          label="Code de vérification"
          :help="blockedMessage ? undefined : 'Le code est valable 10 minutes.'"
          :error="codeError"
          :disabled="Boolean(blockedMessage) || verifying"
        />
        <BaseAlert :message="blockedMessage" variant="warning" announcement="polite" />
      </div>

      <div class="flex flex-col items-center gap-epolia-md">
        <BaseButton
          v-if="blockedMessage"
          class="w-full"
          :label="
            secondsLeft > 0
              ? `Recevoir un nouveau code dans ${countdown}`
              : 'Recevoir un nouveau code'
          "
          :loading="sending"
          :disabled="secondsLeft > 0 || locked"
          @click="requestNewCode"
        />
        <BaseButton
          v-else
          class="w-full"
          type="submit"
          label="Vérifier"
          :loading="verifying"
          :disabled="!canVerify"
        />
        <BaseAlert :message="formError" variant="error" announcement="assertive" />

        <p
          v-if="!blockedMessage && !locked"
          class="flex flex-wrap items-center justify-center gap-x-epolia-2xs text-center text-epolia-body-small text-epolia-text-secondary"
        >
          <span>Vous n’avez rien reçu ?</span>
          <span v-if="secondsLeft > 0">Renvoyer le code dans {{ countdown }}</span>
          <BaseButton
            v-else
            label="Renvoyer le code"
            variant="tertiary"
            class="px-0 text-epolia-body-small"
            :loading="sending"
            @click="requestNewCode"
          />
        </p>
      </div>

      <BaseAlert
        :message="resendMessage"
        :variant="resendFailed ? 'error' : 'success'"
        announcement="polite"
      />
      <BaseAlert message="Pensez à regarder dans vos courriers indésirables." />
      <BaseAlert
        v-if="auth.persistenceFailed"
        message="Votre session est active pour cette utilisation. Elle n’a pas pu être enregistrée sur cet appareil."
        variant="warning"
      />
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconMail from '~icons/material-symbols/mail'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import { useEmailVerification } from '@/domains/auth/composables/useEmailVerification'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseCodeInput from '@/shared/components/BaseCodeInput.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const router = useRouter()
const {
  auth,
  verified,
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
  resend,
} = useEmailVerification()
const email = computed(() => auth.user?.email ?? '')
const codeInput = useTemplateRef('codeInput')

async function requestNewCode() {
  if (!(await resend())) return
  await nextTick()
  codeInput.value?.focus()
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
    if (isVerified) router.replace({ name: 'home' })
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
</script>

<style scoped>
@layer components {
  .email-verification-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 9999px;
    background-color: var(--color-epolia-secondary-hover);
    color: var(--color-epolia-primary);
  }
}
</style>
