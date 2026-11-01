<script setup lang="ts">
import type { VNodeChild } from 'vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

withDefaults(
  defineProps<{
    title: string
    level?: 'h1' | 'h2' | 'h3' | 'h4'
    showBack?: boolean
    backLabel?: string
  }>(),
  { level: 'h1', showBack: false, backLabel: 'Retour' },
)

const emit = defineEmits<{ back: [] }>()
defineSlots<{ actions?(): VNodeChild }>()
</script>

<template>
  <header class="base-header">
    <BaseButton
      v-if="showBack"
      :label="backLabel"
      variant="tertiary"
      class="base-header-back"
      @click="emit('back')"
    />
    <div class="base-header-content">
      <BaseTitle :level="level" class="base-header-title">{{ title }}</BaseTitle>
      <div v-if="$slots.actions" class="base-header-actions"><slot name="actions" /></div>
    </div>
  </header>
</template>

<style scoped>
@layer components {
  .base-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-md);
    min-width: 0;
    color: var(--color-epolia-text);
  }

  .base-header-back {
    align-self: flex-start;
  }

  .base-header-content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--spacing-epolia-md);
    min-width: 0;
  }

  .base-header-title {
    flex: 1 1 16rem;
    min-width: 0;
  }

  .base-header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-epolia-xs);
    min-width: 0;
    max-width: 100%;
  }
}
</style>
