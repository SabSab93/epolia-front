<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-12 min-w-12 max-w-full items-center justify-center gap-epolia-xs rounded-lg border px-epolia-md py-epolia-sm text-epolia-body font-semibold whitespace-normal break-words touch-manipulation transition-colors active:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-epolia-focus focus-visible:ring-offset-2 focus-visible:ring-offset-epolia-page disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none',
  {
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
  },
)

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
    :class="cn(buttonVariants({ variant }), props.class)"
  >
    <span
      v-if="loading"
      aria-hidden="true"
      class="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
    <span class="min-w-0">{{ label }}</span>
  </Primitive>
</template>
