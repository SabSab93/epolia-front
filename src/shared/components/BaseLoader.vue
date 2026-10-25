<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'spinner' | 'linear'
    label?: string
    loading?: boolean
    decorative?: boolean
  }>(),
  { variant: 'spinner', label: 'Chargement en cours.', loading: true, decorative: false },
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
            'base-loader min-w-0 max-w-full text-epolia-body',
            !decorative && 'text-epolia-primary',
            variant === 'linear'
              ? 'flex w-full flex-col items-start gap-epolia-xs'
              : 'inline-flex items-center gap-epolia-xs',
          ]
        : undefined
    "
  >
    <template v-if="loading">
      <span
        v-if="variant === 'spinner'"
        aria-hidden="true"
        class="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
      />
      <span v-else aria-hidden="true" class="loader-track">
        <span class="loader-segment" />
      </span>
      <span v-if="!decorative" class="min-w-0">{{ label }}</span>
    </template>
  </span>
</template>

<style scoped>
.base-loader {
  overflow-wrap: anywhere;
}

.loader-track {
  position: relative;
  display: block;
  width: 100%;
  height: 0.25rem;
  overflow: hidden;
  border-radius: 9999px;
}

.loader-track::before {
  position: absolute;
  inset: 0;
  content: '';
  background: currentColor;
  opacity: 0.15;
}

.loader-segment {
  display: block;
  width: 40%;
  height: 100%;
  border-radius: inherit;
  background: currentColor;
  animation: loader-travel 1.4s ease-in-out infinite;
}

@keyframes loader-travel {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-segment {
    animation: none;
  }
}
</style>
