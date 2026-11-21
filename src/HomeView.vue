<template>
  <main
    ref="content"
    tabindex="-1"
    class="epolia-screen-padding flex min-h-dvh flex-col items-center gap-epolia-lg bg-epolia-secondary-hover text-epolia-text outline-none [--epolia-screen-block:var(--spacing-epolia-xl)]"
  >
    <AppHeader />
    <section class="my-auto w-full max-w-sm space-y-epolia-xl">
      <div class="space-y-epolia-xs text-center">
        <BaseTitle level="h1" class="text-epolia-primary">Epolia</BaseTitle>
        <p class="text-epolia-body text-epolia-text-secondary">
          Trouvez un étudiant pour une mission ou proposez vos services.
        </p>
      </div>

      <div class="flex flex-col gap-epolia-xs">
        <BaseLoader
          :loading="checkingSession"
          :class="checkingSession ? 'justify-center' : 'sr-only'"
          label="Vérification de la session…"
        />
        <template v-if="auth.status === 'unavailable'">
          <BaseAlert
            message="Impossible de vérifier la session. Réessayez."
            variant="error"
            announcement="assertive"
          />
          <BaseButton
            label="Réessayer"
            variant="secondary"
            :loading="auth.isRestoring"
            @click="retrySession"
          />
        </template>
        <template v-else-if="auth.isAuthenticated || auth.removalFailed || signingOut">
          <BaseButton
            label="Se déconnecter"
            variant="secondary"
            class="w-full"
            :loading="signingOut"
            @click="signOut"
          />
        </template>
        <template v-else-if="!auth.isRestoring">
          <BaseButton
            label="S’inscrire"
            variant="primary"
            class="w-full"
            @click="openRegistration"
          />
          <BaseButton label="Se connecter" variant="secondary" class="w-full" @click="openLogin" />
        </template>
        <BaseAlert
          :message="
            auth.removalFailed
              ? 'Le jeton enregistré sur cet appareil n’a pas pu être effacé. Réessayez de vous déconnecter.'
              : ''
          "
          variant="error"
          announcement="assertive"
        />
        <BaseAlert
          :message="
            auth.isAuthenticated && auth.persistenceFailed
              ? 'Votre nouvelle session est active. Elle n’a pas pu être enregistrée sur cet appareil.'
              : ''
          "
          variant="warning"
          announcement="polite"
        />
        <BaseAlert
          :message="signedOut ? 'Vous êtes déconnecté.' : ''"
          variant="success"
          announcement="polite"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppHeader from '@/AppHeader.vue'
import { useHomeView } from '@/composables/useHomeView'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const {
  auth,
  checkingSession,
  signingOut,
  signedOut,
  retrySession,
  signOut,
  openRegistration,
  openLogin,
} = useHomeView()
</script>
