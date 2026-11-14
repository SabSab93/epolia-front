<template>
  <header v-if="availableRole" class="w-full max-w-md text-end">
    <AccountMenu :role="availableRole" />
  </header>
</template>

<script setup lang="ts">
import { useAppHeader } from '@/composables/useAppHeader'
import AccountMenu from '@/domains/auth/components/AccountMenu.vue'

const { availableRole } = useAppHeader()
</script>
