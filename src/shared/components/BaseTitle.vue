<script setup lang="ts">
withDefaults(
  defineProps<{
    level?: 'h1' | 'h2' | 'h3' | 'h4'
  }>(),
  { level: 'h2' },
)
</script>

<template>
  <component :is="level" class="base-title">
    <slot />
  </component>
</template>

<style scoped>
.base-title {
  font-family: var(--font-epolia-heading);
  font-stretch: 100%;
  line-height: 1.25;
  overflow-wrap: break-word;
}

h1.base-title {
  font-size: var(--text-epolia-title-lg);
  font-weight: 800;
}

h2.base-title {
  font-size: var(--text-epolia-title-md);
  font-weight: 700;
  font-stretch: 75%;
}

h3.base-title {
  font-size: var(--text-epolia-title-sm);
  font-weight: 600;
}

h4.base-title {
  font-size: var(--text-epolia-title-xs);
  font-weight: 500;
}
</style>
