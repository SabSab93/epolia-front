<script setup lang="ts">
import type { VNodeChild } from 'vue'

defineSlots<{
  header?(): VNodeChild
  default?(): VNodeChild
  actions?(): VNodeChild
}>()
</script>

<template>
  <div class="base-card">
    <div v-if="$slots.header" class="base-card-content"><slot name="header" /></div>
    <div v-if="$slots.default" class="base-card-content"><slot /></div>
    <div v-if="$slots.actions" class="base-card-actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
@layer components {
  .base-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-md);
    min-width: 0;
    padding: var(--spacing-epolia-md);
    border: 1px solid var(--color-epolia-border);
    border-radius: var(--radius);
    background: var(--color-epolia-surface);
    color: var(--color-epolia-text);
    font-family: var(--font-epolia-body);
    font-size: var(--text-epolia-body);
    line-height: var(--text-epolia-body--line-height);
    overflow-wrap: anywhere;
  }

  .base-card-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-epolia-xs);
    min-width: 0;
  }

  .base-card-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-epolia-xs);
    min-width: 0;
  }
}
</style>
