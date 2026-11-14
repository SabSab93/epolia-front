<template>
  <AuthLayout title="Se connecter" :back-to="{ name: 'home' }" back-label="Retour à l’accueil">
    <div class="flex flex-col gap-epolia-md">
      <BaseAlert :message="sessionMessage" variant="error" announcement="assertive" />
      <BaseButton
        v-if="auth.status === 'unavailable'"
        label="Réessayer"
        variant="secondary"
        :loading="auth.isRestoring"
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
      <p>Le formulaire de connexion est en cours de développement.</p>
    </div>

    <template #links>
      <AuthLink :to="{ name: 'choose-role' }">Créer un compte</AuthLink>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'

const auth = useAuthStore()
const router = useRouter()
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

async function retrySession() {
  const origin = router.currentRoute.value
  await auth.restore()
  if (router.currentRoute.value !== origin || !auth.isAuthenticated) return

  const destination = origin.redirectedFrom
  if (destination?.matched.some(({ meta }) => meta.requiresAuth)) {
    await router.replace(destination.fullPath)
    return
  }

  await router.replace({ name: 'home' })
}
</script>
