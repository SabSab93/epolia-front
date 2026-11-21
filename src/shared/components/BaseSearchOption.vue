<template>
  <ComboboxItem
    :value="value"
    :text-value="label"
    class="epolia-dropdown-option flex min-h-12 min-w-0 cursor-pointer flex-col justify-center rounded-lg px-epolia-sm py-epolia-xs text-epolia-body wrap-anywhere"
  >
    <span :class="description ? 'line-clamp-2' : 'line-clamp-3'">{{ label }}</span>
    <span v-if="description" class="truncate text-epolia-body-small text-epolia-text-secondary">
      {{ description }}
    </span>
  </ComboboxItem>
</template>

<script setup lang="ts">
import { ComboboxItem } from 'reka-ui'

defineProps<{ value: string; label: string; description?: string }>()
</script>
