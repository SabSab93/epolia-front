<template>
  <AuthLayout
    :title="showTerms ? 'Conditions d’utilisation' : 'Créer un compte'"
    :back-to="{ name: 'choose-role', query: { role } }"
    :back-label="showTerms ? 'Revenir au formulaire' : 'Retour au choix du compte'"
    :back-action="showTerms ? closeTerms : undefined"
  >
    <RegistrationTerms v-if="showTerms" @accept="closeTerms(true)" @decline="declineTerms" />

    <form
      v-else
      ref="form"
      novalidate
      class="flex flex-col gap-epolia-md"
      :aria-busy="submitting"
      @submit.prevent="submit"
    >
      <div class="flex flex-col gap-epolia-xs">
        <BaseTitle>Créez votre compte</BaseTitle>
        <p class="text-epolia-text-secondary">
          {{
            role === AccountRoleEnum.Student
              ? 'Compte étudiant, gratuit et sans engagement.'
              : 'Gratuit et sans engagement.'
          }}
        </p>
      </div>
      <div class="register-names">
        <BaseInput
          v-model="firstName"
          name="firstName"
          label="Prénom"
          placeholder="Marie"
          autocomplete="given-name"
          :error="errors.firstName"
          required
          :disabled="submitting"
        />
        <BaseInput
          v-model="lastName"
          name="lastName"
          label="Nom"
          placeholder="Dupont"
          autocomplete="family-name"
          :error="errors.lastName"
          required
          :disabled="submitting"
        />
      </div>
      <BaseInput
        v-model="email"
        name="email"
        label="Adresse e-mail"
        placeholder="marie.dupont@email.fr"
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
      <div
        v-if="termsAvailable && !termsVersionRejected"
        ref="termsActions"
        class="flex flex-col items-start gap-epolia-xs"
      >
        <BaseCheckbox
          :model-value="termsAccepted"
          name="termsAccepted"
          label="J’accepte les conditions générales d’utilisation"
          :error="errors.termsAccepted"
          :disabled="submitting"
          required
          @update:model-value="changeTermsAcceptance"
        />
        <BaseButton
          label="Lire les conditions générales d’utilisation"
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
        :disabled="!termsAvailable || termsVersionRejected"
      />
      <p
        class="flex flex-wrap items-center justify-center gap-x-epolia-2xs text-epolia-body-small text-epolia-text-secondary"
      >
        <span>Vous avez déjà un compte ?</span>
        <AuthLink :to="{ name: 'login' }">Se connecter</AuthLink>
      </p>
      <template v-if="role === AccountRoleEnum.Customer">
        <hr class="border-epolia-border" />
        <RouterLink
          :to="{ name: 'register', query: { role: AccountRoleEnum.Student } }"
          class="register-student-link border border-epolia-border"
        >
          <span class="register-student-icon">
            <BaseIcon :icon="IconSchool" :size="20" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col text-epolia-body-small font-semibold">
            <span class="text-epolia-text">Vous êtes étudiant ?</span>
            <span class="text-epolia-primary">Proposer mes services sur Epolia</span>
          </span>
          <BaseIcon :icon="IconArrowForward" :size="20" class="text-epolia-primary" />
        </RouterLink>
      </template>
      <p class="flex items-start gap-epolia-xs text-epolia-body-small text-epolia-text-secondary">
        <BaseIcon :icon="IconLock" :size="20" class="shrink-0" />
        <span
          >Votre nom de famille et votre adresse e-mail ne sont jamais affichés publiquement.</span
        >
      </p>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { onBeforeRouteUpdate, RouterLink, useRoute, useRouter } from 'vue-router'
import IconArrowForward from '~icons/material-symbols/arrow-forward'
import IconLock from '~icons/material-symbols/lock'
import IconSchool from '~icons/material-symbols/school'
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
import BaseIcon from '@/shared/components/BaseIcon.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const role = computed(() => parseAccountRole(route.query.role))
const demoTermsVersion = terms.version
const termsAvailable =
  import.meta.env.DEV || import.meta.env.VITE_REGISTRATION_TERMS_VERSION === demoTermsVersion
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const birthDate = ref('')
const password = ref('')
const showTerms = ref(false)
const termsAccepted = ref(false)
const termsVersionRejected = ref(false)
const submitting = ref(false)
const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
  password: '',
  termsAccepted: '',
})
const errorMessage = ref(termsAvailable ? '' : 'L’inscription est indisponible pour le moment.')
const termsActions = useTemplateRef('termsActions')
const form = useTemplateRef('form')
let returnToCheckbox = false

onBeforeRouteUpdate((to, from) => {
  if (submitting.value && to.query.role !== from.query.role) return false
})

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
  const today = new Date().toISOString().slice(0, 10)
  const adultBirthDateLimit = String(Number(today.slice(0, 4)) - 18) + today.slice(4)
  if (value > today) return 'Choisissez une date qui n’est pas dans le futur.'
  if (value > adultBirthDateLimit) return 'Vous devez avoir au moins 18 ans.'
  return ''
}

async function submit() {
  if (submitting.value || !role.value || !termsAvailable || termsVersionRejected.value) return

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
    // The next step: enter the 6-digit code sent by e-mail.
    await router.replace({ name: 'email-verification' })
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
        termsVersionRejected.value = true
        errorMessage.value = 'Les conditions ont changé. Réessayez plus tard.'
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

<style scoped>
@layer components {
  .register-names {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: var(--spacing-epolia-sm);
  }

  .register-student-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-epolia-sm);
    min-height: 3rem;
    padding: var(--spacing-epolia-sm);
    border-radius: var(--radius-xl);
    background-color: var(--color-epolia-surface);
  }

  .register-student-link:focus-visible {
    outline: 2px solid var(--color-epolia-focus);
    outline-offset: 2px;
  }

  .register-student-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background-color: var(--color-epolia-secondary-hover);
    color: var(--color-epolia-primary);
  }
}
</style>
