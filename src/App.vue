<template>
  <BaseLoader
    v-if="route.name !== 'home'"
    :loading="showSessionLoader"
    label="Vérification de la session…"
    :class="showSessionLoader ? 'epolia-screen-padding bg-epolia-page' : 'sr-only'"
  />
  <RouterView
    v-if="auth.isAuthenticated || !route.matched.some(({ meta }) => meta.requiresAuth)"
    v-slot="{ Component, route: currentRoute }"
  >
    <component
      :is="Component"
      :key="currentRoute.name === 'register' ? String(currentRoute.query.role) : undefined"
    />
  </RouterView>
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
