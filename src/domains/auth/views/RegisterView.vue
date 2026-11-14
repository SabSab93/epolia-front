<template>
  <AuthLayout
    :title="showTerms ? 'Conditions d’utilisation' : 'Créer un compte'"
    :back-to="success ? { name: 'home' } : { name: 'choose-role', query: { role } }"
    :back-label="
      showTerms
        ? 'Revenir au formulaire'
        : success
          ? 'Retour à l’accueil'
          : 'Retour au choix du compte'
    "
    :back-action="showTerms ? closeTerms : undefined"
  >
    <section v-if="success" ref="confirmation" tabindex="-1" class="flex flex-col gap-epolia-md">
      <BaseTitle>Votre compte est créé</BaseTitle>
      <p>La prochaine étape sera de confirmer votre adresse e-mail.</p>
      <BaseAlert
        v-if="auth.persistenceFailed"
        message="Votre session est active pour cette utilisation. Elle n’a pas pu être enregistrée sur cet appareil."
        variant="warning"
      />
      <BaseButton label="Retour à l’accueil" @click="router.replace({ name: 'home' })" />
    </section>

    <RegistrationTerms v-else-if="showTerms" @accept="closeTerms(true)" @decline="declineTerms" />

    <form
      v-else
      ref="form"
      novalidate
      class="flex flex-col gap-epolia-md"
      :aria-busy="submitting"
      @submit.prevent="submit"
    >
      <p class="font-semibold">
        {{ role === AccountRoleEnum.Customer ? 'Compte particulier' : 'Compte étudiant' }}
      </p>
      <BaseInput
        v-model="firstName"
        name="firstName"
        label="Prénom"
        autocomplete="given-name"
        :error="errors.firstName"
        required
        :disabled="submitting"
      />
      <BaseInput
        v-model="lastName"
        name="lastName"
        label="Nom"
        autocomplete="family-name"
        :error="errors.lastName"
        required
        :disabled="submitting"
      />
      <BaseInput
        v-model="email"
        name="email"
        label="Adresse e-mail"
        type="email"
        autocomplete="email"
        required
        :disabled="submitting"
        :error="errors.email"
      />
      <BaseInput
        v-model="birthDate"
        name="birthDate"
        label="Date de naissance"
        type="date"
        autocomplete="bday"
        :max="today"
        :clearable="false"
        required
        :disabled="submitting"
        :error="errors.birthDate"
      />
      <BaseInput
        v-model="password"
        name="password"
        label="Mot de passe"
        type="password"
        autocomplete="new-password"
        :clearable="false"
        :help="errors.password ? undefined : '8 caractères minimum.'"
        :error="errors.password"
        required
        :disabled="submitting"
      />
      <div v-if="termsAvailable" ref="termsActions" class="flex flex-col items-start gap-epolia-xs">
        <BaseCheckbox
          :model-value="termsAccepted"
          name="termsAccepted"
          label="J’accepte les conditions d’utilisation"
          :error="errors.termsAccepted"
          :disabled="submitting"
          required
          @update:model-value="changeTermsAcceptance"
        />
        <BaseButton
          label="Lire les conditions d’utilisation"
          variant="tertiary"
          class="border-0 px-0 text-start text-epolia-body-small underline underline-offset-4"
          :disabled="submitting"
          @click="openTerms()"
        />
        <p role="status" class="text-epolia-body-small text-epolia-text-secondary">
          {{
            termsAccepted
              ? 'Conditions d’utilisation acceptées.'
              : errors.termsAccepted
                ? ''
                : 'À accepter pour créer votre compte.'
          }}
        </p>
      </div>
      <BaseAlert :message="errorMessage" variant="error" announcement="assertive" />
      <BaseButton
        label="Créer mon compte"
        type="submit"
        :loading="submitting"
        :disabled="!termsAvailable"
      />
    </form>

    <template #links>
      <AuthLink v-if="!success && !showTerms" :to="{ name: 'login' }"
        >Déjà un compte ? Se connecter</AuthLink
      >
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseAccountRole } from '@/domains/auth/accountRole'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import RegistrationTerms from '@/domains/auth/components/RegistrationTerms.vue'
import terms from '@/domains/auth/content/cgu-test-v1.json'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { ApiError } from '@/shared/api/apiClient'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseCheckbox from '@/shared/components/BaseCheckbox.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const role = computed(() => parseAccountRole(route.query.role))
const demoTermsVersion = terms.version
const termsAvailable =
  import.meta.env.DEV || import.meta.env.VITE_REGISTRATION_TERMS_VERSION === demoTermsVersion
const today = new Date().toISOString().slice(0, 10)
const adultBirthDateLimit = String(Number(today.slice(0, 4)) - 18) + today.slice(4)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const birthDate = ref('')
const password = ref('')
const showTerms = ref(false)
const termsAccepted = ref(false)
const submitting = ref(false)
const success = ref(false)
const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  password: '',
  termsAccepted: '',
})
const errorMessage = ref(termsAvailable ? '' : 'L’inscription est indisponible pour le moment.')
const confirmation = useTemplateRef('confirmation')
const termsActions = useTemplateRef('termsActions')
const form = useTemplateRef('form')
let returnToCheckbox = false

watch(firstName, () => {
  errors.firstName = ''
})
watch(lastName, () => {
  errors.lastName = ''
})
watch(email, () => {
  errors.email = ''
})
watch(birthDate, () => {
  errors.birthDate = ''
})
watch(password, () => {
  errors.password = ''
})

function openTerms(fromCheckbox = false) {
  returnToCheckbox = fromCheckbox
  showTerms.value = true
}

function changeTermsAcceptance(checked: boolean) {
  if (checked) openTerms(true)
  else termsAccepted.value = false
}

function declineTerms() {
  termsAccepted.value = false
  return closeTerms()
}

async function closeTerms(accepted = false) {
  if (accepted) {
    termsAccepted.value = true
    errors.termsAccepted = ''
    errorMessage.value = ''
  }
  showTerms.value = false
  await nextTick()
  termsActions.value?.querySelector(returnToCheckbox ? 'input' : 'button')?.focus()
}

function validateBirthDate() {
  const value = birthDate.value
  const date = new Date(`${value}T00:00:00.000Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith('0000-') ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return 'Vérifiez votre date de naissance.'
  }
  if (value > today) return 'Choisissez une date qui n’est pas dans le futur.'
  if (value > adultBirthDateLimit) return 'Vous devez avoir au moins 18 ans.'
  return ''
}

async function submit() {
  if (submitting.value || success.value || !role.value || !termsAvailable) return

  errorMessage.value = ''
  errors.firstName = firstName.value.trim() ? '' : 'Indiquez votre prénom.'
  errors.lastName = lastName.value.trim() ? '' : 'Indiquez votre nom.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
    ? ''
    : 'Vérifiez votre adresse e-mail.'
  errors.birthDate = validateBirthDate()
  errors.password =
    password.value.length < 8 ? 'Choisissez un mot de passe d’au moins 8 caractères.' : ''
  errors.termsAccepted = termsAccepted.value ? '' : 'Acceptez les conditions pour continuer.'
  const firstInvalid = Object.entries(errors).find(([, message]) => message)
  if (firstInvalid) {
    await focusField(firstInvalid[0])
    return
  }

  submitting.value = true
  let invalidField = ''
  try {
    await auth.register({
      role: role.value,
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      birthDate: birthDate.value,
      password: password.value,
      termsAccepted: true,
      termsVersion: demoTermsVersion,
    })
    password.value = ''
    success.value = true
    await nextTick()
    confirmation.value?.focus()
  } catch (error) {
    const code = error instanceof ApiError ? error.code : undefined
    switch (code) {
      case 'EMAIL_ALREADY_USED':
        errors.email = 'Cet e-mail est déjà utilisé.'
        invalidField = 'email'
        break
      case 'ADULT_REQUIRED':
      case 'BIRTH_DATE_REQUIRED':
        errors.birthDate = 'Vous devez avoir au moins 18 ans.'
        invalidField = 'birthDate'
        break
      case 'TERMS_VERSION_INVALID':
        termsAccepted.value = false
        errors.termsAccepted = 'Les conditions ont changé. Rechargez la page.'
        invalidField = 'termsAccepted'
        break
      case 'TERMS_ACCEPTANCE_REQUIRED':
        termsAccepted.value = false
        errors.termsAccepted = 'Acceptez les conditions pour continuer.'
        invalidField = 'termsAccepted'
        break
      case 'REGISTRATION_TERMS_UNAVAILABLE':
        errorMessage.value = 'L’inscription est indisponible. Réessayez un peu plus tard.'
        break
      case 'VALIDATION_ERROR':
        errorMessage.value = 'Vérifiez vos informations, puis réessayez.'
        break
      default:
        errorMessage.value =
          'Création du compte non confirmée. Vérifiez votre connexion, puis réessayez.'
    }
  } finally {
    submitting.value = false
  }
  if (invalidField) await focusField(invalidField)
}

async function focusField(name: string) {
  await nextTick()
  const fields = Array.from(form.value?.querySelectorAll('input') ?? [])
  fields.find((field) => field.name === name)?.focus()
}
</script>
