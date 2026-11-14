<template>
  <RouterLink
    :to="to"
    class="flex min-h-12 max-w-full items-center text-center wrap-anywhere font-semibold text-epolia-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-focus"
  >
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw }>()
</script>
