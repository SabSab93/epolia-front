<script setup lang="ts">
import type { VNodeChild } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    clearable?: boolean
    disabled?: boolean
  }>(),
  { clearable: false, disabled: false },
)

const emit = defineEmits<{ remove: [] }>()
defineSlots<{ icon?(): VNodeChild }>()

function remove() {
  if (props.clearable && !props.disabled) emit('remove')
}
</script>

<template>
  <span
    class="base-tag"
    :class="{ 'base-tag-disabled': disabled, 'base-tag-clearable': clearable }"
  >
    <span v-if="$slots.icon" aria-hidden="true" class="base-tag-icon"><slot name="icon" /></span>
    <span class="base-tag-label">{{ label }}</span>
    <button
      v-if="clearable"
      type="button"
      :disabled="disabled"
      :aria-label="`Retirer ${label}`"
      class="base-tag-remove"
      @click="remove"
    >
      <span aria-hidden="true">×</span>
    </button>
  </span>
</template>

<style scoped>
@layer components {
  .base-tag {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--spacing-epolia-xs);
    min-width: 0;
    min-height: 3rem;
    max-width: 100%;
    padding-inline: var(--spacing-epolia-sm);
    border: 1px solid var(--color-epolia-primary);
    border-radius: var(--radius);
    background: var(--color-epolia-secondary-hover);
    color: var(--color-epolia-text);
    font-family: var(--font-epolia-body);
    font-size: var(--text-epolia-body);
    line-height: var(--text-epolia-body--line-height);
    vertical-align: middle;
  }

  .base-tag-clearable {
    padding-inline-end: var(--spacing-epolia-2xs);
  }

  .base-tag-label {
    flex: 1 1 auto;
    min-width: 0;
    padding-block: var(--spacing-epolia-xs);
    overflow-wrap: anywhere;
  }

  .base-tag-icon {
    display: inline-flex;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: var(--color-epolia-primary);
  }

  .base-tag-icon :deep(svg) {
    width: 100%;
    height: 100%;
  }

  .base-tag-remove {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    min-height: 48px;
    border-radius: var(--radius);
    color: var(--color-epolia-primary);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
  }

  .base-tag-remove:active:enabled {
    background: var(--color-epolia-primary);
    color: var(--color-epolia-primary-text);
  }

  .base-tag-remove:focus-visible {
    outline: 2px solid var(--color-epolia-primary);
    outline-offset: 2px;
  }

  .base-tag-disabled {
    border-color: var(--color-epolia-input-disabled-border);
    background: var(--color-epolia-input-disabled);
  }

  .base-tag-remove:disabled {
    cursor: not-allowed;
    color: var(--color-epolia-text-secondary);
  }

  @media (forced-colors: active) {
    .base-tag {
      border-color: CanvasText;
    }

    .base-tag-icon,
    .base-tag-remove {
      color: ButtonText;
    }

    .base-tag-remove:disabled {
      color: GrayText;
    }

    .base-tag-remove:focus-visible {
      outline-color: Highlight;
    }
  }
}
</style>
