<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseAccountRole } from '@/domains/auth/accountRole'
import { AccountRole } from '@/domains/auth/models/enums/AccountRole'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseCardButton from '@/shared/components/BaseCardButton.vue'

const route = useRoute()
const router = useRouter()
const selectedRole = ref(parseAccountRole(route.query.role))

const roleOptions = [
  {
    value: AccountRole.Customer,
    label: 'Je suis particulier',
    description:
      'Décrivez votre besoin et trouvez un étudiant pour vous aider, par exemple pour des cours, un dépannage informatique ou un projet créatif.',
  },
  {
    value: AccountRole.Student,
    label: 'Je suis étudiant',
    description:
      'Présentez vos compétences, proposez vos services et choisissez des missions qui s’accordent avec votre emploi du temps.',
  },
] as const

async function continueToRegistration() {
  const role = selectedRole.value
  if (!role) return

  await router.replace({ name: 'choose-role', query: { role } })
  await router.push({ name: 'register', query: { role } })
}
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
