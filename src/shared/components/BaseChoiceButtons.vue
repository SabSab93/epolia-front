<template>
  <fieldset class="min-w-0">
    <legend class="mb-epolia-xs font-semibold">{{ legend }}</legend>
    <div class="flex flex-wrap gap-epolia-xs">
      <label v-for="option in options" :key="option.value" class="relative flex min-w-12 flex-1">
        <input
          v-model="choice"
          type="radio"
          :name="name ?? groupId"
          :value="option.value"
          :disabled="option.disabled"
          class="peer sr-only"
        />
        <span
          class="grid min-h-12 w-full cursor-pointer place-items-center rounded-epolia border border-epolia-primary bg-epolia-secondary-hover px-epolia-xs py-epolia-xs text-center text-epolia-body-small wrap-anywhere text-epolia-text peer-checked:bg-epolia-primary peer-checked:font-semibold peer-checked:text-epolia-primary-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-epolia-focus peer-disabled:cursor-not-allowed peer-disabled:border-epolia-input-disabled-border peer-disabled:bg-epolia-input-disabled peer-disabled:text-epolia-text-secondary forced-colors:peer-checked:underline"
          >{{ option.label }}</span
        >
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { SelectOption } from '@/shared/models/types/selectOption.type'

defineProps<{ legend: string; options: readonly SelectOption[]; name?: string }>()
const choice = defineModel<string>()
const groupId = useId()
</script>
