<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { parseAccountRole } from '@/domains/auth/accountRole'
import { AccountRole } from '@/domains/auth/models/enums/AccountRole'
import AuthLink from '@/domains/auth/components/AuthLink.vue'
import AuthLayout from '@/domains/auth/components/AuthLayout.vue'

const route = useRoute()
const role = computed(() => parseAccountRole(route.query.role))
</script>

<template>
  <AuthLayout
    title="Créer un compte"
    :back-to="{ name: 'choose-role', query: { role } }"
    back-label="Retour au choix du compte"
  >
    <p class="font-semibold">
      {{ role === AccountRole.Customer ? 'Compte particulier' : 'Compte étudiant' }}
    </p>
    <p class="mt-epolia-xs">Le formulaire d’inscription est en cours de développement.</p>

    <template #links>
      <AuthLink :to="{ name: 'login' }">Déjà un compte ? Se connecter</AuthLink>
    </template>
  </AuthLayout>
</template>
