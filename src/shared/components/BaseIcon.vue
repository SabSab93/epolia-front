<template>
  <component
    :is="icon"
    :role="name ? 'img' : undefined"
    :aria-label="name"
    :aria-hidden="name ? undefined : true"
    focusable="false"
    :class="['base-icon', size === 20 ? 'base-icon-20' : 'base-icon-24']"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Icon imported explicitly, e.g. `import IconHome from '~icons/material-symbols/home'`. */
    icon: Component
    /** 20 inside a button, 24 for navigation. Converted to rem to follow text zoom. */
    size?: 20 | 24
    /** Text alternative for an informative icon. Without it, the icon is hidden from screen readers. */
    label?: string
  }>(),
  { size: 24, label: undefined },
)

// A blank label would expose an unnamed image: treat it as decorative.
const name = computed(() => props.label?.trim() || undefined)
</script>

<style scoped>
@layer components {
  .base-icon {
    display: inline-block;
    flex-shrink: 0;
  }

  .base-icon-20 {
    width: 1.25rem;
    height: 1.25rem;
  }

  .base-icon-24 {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
