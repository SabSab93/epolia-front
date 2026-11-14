<script setup lang="ts">
import { ref } from 'vue'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import BaseCardButton from '@/shared/components/BaseCardButton.vue'

const selectedRole = ref<string>()

const roleOptions = [
  {
    value: 'CUSTOMER',
    label: 'Je suis particulier',
    description:
      'Décrivez votre besoin et trouvez un étudiant pour vous aider, par exemple pour des cours, un dépannage informatique ou un projet créatif.',
  },
  {
    value: 'STUDENT',
    label: 'Je suis étudiant',
    description:
      'Présentez vos compétences, proposez vos services et choisissez des missions qui s’accordent avec votre emploi du temps.',
  },
]
</script>

<template>
  <AuthLayout
    title="Qui êtes-vous ?"
    :back-to="{ name: 'home' }"
    back-label="Retour à l’accueil"
    wide
    class="bg-linear-to-b from-epolia-secondary-hover to-epolia-page to-55% md:[--epolia-screen-block:var(--spacing-epolia-2xl)]"
  >
    <div role="group" aria-label="Type de compte" class="grid gap-epolia-md md:grid-cols-2">
      <BaseCardButton
        v-for="option in roleOptions"
        :key="option.value"
        :title="option.label"
        :description="option.description"
        :selected="selectedRole === option.value"
        @click="selectedRole = option.value"
      />
    </div>

    <template #links>
      <AuthLink :to="{ name: 'login' }">Se connecter</AuthLink>
    </template>
  </AuthLayout>
</template>
