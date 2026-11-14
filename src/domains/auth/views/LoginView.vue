<template>
  <AuthLayout title="Se connecter" :back-to="{ name: 'home' }" back-label="Retour à l’accueil">
    <div class="flex flex-col gap-epolia-md">
      <BaseAlert :message="formError || sessionMessage" variant="error" announcement="assertive" />
      <BaseButton
        v-if="auth.status === 'unavailable' && !formError"
        label="Réessayer"
        variant="secondary"
        :loading="auth.isRestoring"
        :disabled="submitting"
        @click="retrySession"
      />
      <BaseAlert
        v-if="auth.removalFailed"
        message="La session n’a pas pu être effacée de l’appareil. Réessayez de vous déconnecter."
        variant="error"
        announcement="assertive"
      />
      <BaseButton
        v-if="auth.removalFailed"
        label="Se déconnecter"
        variant="secondary"
        @click="auth.logout"
      />
      <form
        ref="form"
        class="flex flex-col gap-epolia-md"
        novalidate
        :aria-busy="submitting"
        @submit.prevent="submitForm"
      >
        <BaseInput
          v-model="email"
          name="email"
          label="Adresse e-mail"
          type="email"
          autocomplete="username"
          required
          :disabled="submitting"
          :error="emailError"
        />
        <BaseInput
          v-model="password"
          name="password"
          label="Mot de passe"
          type="password"
          autocomplete="current-password"
          :clearable="false"
          required
          :disabled="submitting"
          :error="passwordError"
        />
        <BaseButton
          label="Se connecter"
          type="submit"
          :loading="submitting"
          :disabled="auth.isRestoring || auth.removalFailed"
        />
      </form>
    </div>

    <template #links>
      <AuthLink :to="{ name: 'choose-role' }">Créer un compte</AuthLink>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef } from 'vue'
import { useLoginForm } from '@/domains/auth/composables/useLoginForm'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'

const form = useTemplateRef('form')
const {
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
} = useLoginForm()

async function submitForm() {
  const invalidField = await submit()
  if (!invalidField) return

  await nextTick()
  const fields = form.value?.querySelectorAll('input') ?? []
  Array.from(fields)
    .find((field) => field.name === invalidField)
    ?.focus()
}
</script>
