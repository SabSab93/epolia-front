<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/utils'
import BaseLoader from '@/shared/components/BaseLoader.vue'

const buttonVariants = cva('base-button', {
  variants: {
    variant: {
      default:
        'border-transparent bg-epolia-primary text-epolia-primary-text hover:bg-epolia-primary-hover active:bg-epolia-primary-active',
      secondary:
        'border-epolia-primary bg-epolia-page text-epolia-primary hover:bg-epolia-secondary-hover active:bg-epolia-secondary-active',
      tertiary:
        'border-transparent bg-transparent text-epolia-primary hover:text-epolia-primary-hover active:text-epolia-primary-active',
    },
  },
  defaultVariants: { variant: 'default' },
})

const props = withDefaults(
  defineProps<{
    label: string
    variant?: NonNullable<VariantProps<typeof buttonVariants>['variant']>
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    class?: HTMLAttributes['class']
  }>(),
  { type: 'button', variant: 'default', disabled: false, loading: false, class: '' },
)
</script>

<template>
  <Primitive
    as="button"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="cn(buttonVariants({ variant }), !loading && 'disabled:opacity-50', props.class)"
  >
    <BaseLoader v-if="loading" decorative inherit-color class="shrink-0" />
    <span class="min-w-0">{{ label }}</span>
  </Primitive>
</template>

<style scoped>
@reference "@/assets/main.css";

@layer components {
  .base-button {
    @apply inline-flex min-h-12 min-w-12 max-w-full items-center justify-center gap-epolia-xs;
    @apply rounded-lg border px-epolia-md py-epolia-sm;
    @apply text-epolia-body font-semibold whitespace-normal break-words;
    @apply touch-manipulation transition-colors active:transition-none motion-reduce:transition-none;
    @apply focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-epolia-focus;
    @apply focus-visible:ring-offset-2 focus-visible:ring-offset-epolia-page;
    @apply disabled:pointer-events-none;
  }
}
</style>
