<template>
  <AuthLayout
    title="Qui êtes-vous ?"
    :back-to="{ name: 'home' }"
    back-label="Retour à l’accueil"
    wide
    class="bg-linear-to-b from-epolia-secondary-hover to-epolia-page to-55% md:[--epolia-screen-block:var(--spacing-epolia-2xl)]"
  >
    <p id="account-choice-help" class="mb-epolia-md text-epolia-body text-epolia-text-secondary">
      Choisissez un type de compte pour continuer.
    </p>
    <div
      role="group"
      aria-label="Type de compte"
      aria-describedby="account-choice-help"
      class="grid gap-epolia-md md:grid-cols-2"
    >
      <BaseCardButton
        v-for="option in roleOptions"
        :key="option.value"
        :title="option.label"
        :description="option.description"
        :selected="selectedRole === option.value"
        @click="selectRole(option.value)"
      />
    </div>

    <BaseButton
      label="Continuer"
      variant="primary"
      class="mt-epolia-lg w-full"
      :disabled="!selectedRole"
      @click="continueToRegistration"
    />

    <template #links>
      <AuthLink :to="{ name: 'login' }">Se connecter</AuthLink>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { useAccountRoleSelection } from '@/domains/auth/composables/useAccountRoleSelection'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseCardButton from '@/shared/components/BaseCardButton.vue'

const { selectedRole, selectRole, continueToRegistration } = useAccountRoleSelection()

const roleOptions = [
  {
    value: AccountRoleEnum.Customer,
    label: 'Je suis particulier',
    description:
      'Décrivez votre besoin et trouvez un étudiant pour vous aider, par exemple pour des cours, un dépannage informatique ou un projet créatif.',
  },
  {
    value: AccountRoleEnum.Student,
    label: 'Je suis étudiant',
    description:
      'Présentez vos compétences, proposez vos services et choisissez des missions qui s’accordent avec votre emploi du temps.',
  },
] as const
</script>
