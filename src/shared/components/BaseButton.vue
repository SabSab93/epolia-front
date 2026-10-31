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
/* Parent utility classes can still override these shared styles. */
@layer components {
  .base-button {
    display: inline-flex;
    min-height: 3rem;
    min-width: 3rem;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-epolia-xs);
    padding: var(--spacing-epolia-sm) var(--spacing-epolia-md);
    border-width: 1px;
    border-style: solid;
    border-radius: var(--radius);
    font-size: var(--text-epolia-body);
    font-weight: 600;
    line-height: var(--text-epolia-body--line-height);
    white-space: normal;
    overflow-wrap: break-word;
    touch-action: manipulation;
    transition-property:
      color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .base-button:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow:
      0 0 0 2px var(--color-epolia-page),
      0 0 0 4px var(--color-epolia-focus);
  }

  .base-button:active {
    transition-property: none;
  }

  .base-button:disabled {
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .base-button {
      transition-property: none;
    }
  }
}
</style>
