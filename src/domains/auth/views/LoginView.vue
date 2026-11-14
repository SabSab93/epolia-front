<script setup lang="ts">
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'
</script>

<template>
  <AuthLayout title="Se connecter" :back-to="{ name: 'home' }" back-label="Retour à l’accueil">
    <p>Le formulaire de connexion est en cours de développement.</p>

    <template #links>
      <AuthLink :to="{ name: 'choose-role' }">Créer un compte</AuthLink>
    </template>
  </AuthLayout>
</template>
