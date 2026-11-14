<template>
  <div v-if="showSessionLoader" class="flex justify-center bg-epolia-page p-epolia-md">
    <BaseLoader label="Vérification de la session…" />
  </div>
  <RouterView v-if="auth.isAuthenticated || !route.matched.some(({ meta }) => meta.requiresAuth)" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import BaseLoader from '@/shared/components/BaseLoader.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showSessionLoader = computed(
  () => auth.isRestoring && !(route.name === 'login' && auth.status === 'unavailable'),
)

void auth.restore()

watch(
  () => auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated && route.matched.some(({ meta }) => meta.requiresAuth)) {
      void router.replace({ name: 'login' })
    }
  },
)
</script>
