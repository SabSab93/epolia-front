<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    loading?: boolean
    decorative?: boolean
    showLabel?: boolean
    inheritColor?: boolean
  }>(),
  {
    label: 'Chargement en cours.',
    loading: true,
    decorative: false,
    showLabel: true,
    inheritColor: false,
  },
)

defineOptions({ inheritAttrs: false })
</script>

<template>
  <span
    v-bind="$attrs"
    :role="decorative ? undefined : 'status'"
    :aria-atomic="decorative ? undefined : true"
    :aria-hidden="decorative ? true : undefined"
    :class="
      loading
        ? [
            'base-loader inline-flex min-w-0 max-w-full items-center gap-epolia-xs text-epolia-body',
            !inheritColor && 'text-epolia-primary',
          ]
        : undefined
    "
  >
    <template v-if="loading">
      <span
        aria-hidden="true"
        class="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
      />
      <span v-if="!decorative" :class="showLabel ? 'min-w-0' : 'sr-only'">{{ label }}</span>
    </template>
  </span>
</template>

<style scoped>
.base-loader {
  overflow-wrap: anywhere;
}
</style>
