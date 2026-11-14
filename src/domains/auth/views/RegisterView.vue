<script setup lang="ts">
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
</script>

<template>
  <AuthLayout
    title="Créer un compte"
    :back-to="{ name: 'choose-role' }"
    back-label="Retour au choix du compte"
  >
    <p>Le formulaire d’inscription est en cours de développement.</p>

    <template #links>
      <AuthLink :to="{ name: 'login' }">Déjà un compte ? Se connecter</AuthLink>
    </template>
  </AuthLayout>
</template>
