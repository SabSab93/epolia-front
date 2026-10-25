<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'

const alertVariants = cva(
  'base-alert flex min-w-0 w-full flex-col gap-epolia-2xs rounded-lg border border-s-4 p-epolia-md text-epolia-body text-epolia-text',
  {
    variants: {
      variant: {
        info: 'border-epolia-alert-info bg-epolia-alert-info-surface',
        success: 'border-epolia-alert-success bg-epolia-alert-success-surface',
        warning: 'border-epolia-alert-warning bg-epolia-alert-warning-surface',
        error: 'border-epolia-alert-error bg-epolia-alert-error-surface',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

withDefaults(
  defineProps<{
    message: string
    title?: string
    variant?: NonNullable<VariantProps<typeof alertVariants>['variant']>
    announcement?: 'off' | 'polite' | 'assertive'
  }>(),
  { title: undefined, variant: 'info', announcement: 'off' },
)

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div
    v-bind="$attrs"
    :role="
      announcement === 'polite' ? 'status' : announcement === 'assertive' ? 'alert' : undefined
    "
    :aria-atomic="announcement !== 'off' ? true : undefined"
    :class="message ? alertVariants({ variant }) : undefined"
  >
    <template v-if="message">
      <p v-if="title" class="font-semibold">{{ title }}</p>
      <p class="whitespace-pre-line">{{ message }}</p>
    </template>
  </div>
</template>

<style scoped>
.base-alert {
  overflow-wrap: anywhere;
}
</style>
