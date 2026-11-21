<template>
  <header v-if="links.length" class="w-full max-w-md text-end">
    <AccountMenu :links="links" />
  </header>
</template>

<script setup lang="ts">
import { useAppHeader } from '@/composables/useAppHeader'
import AccountMenu from '@/domains/auth/components/AccountMenu.vue'

const { links } = useAppHeader()
</script>
