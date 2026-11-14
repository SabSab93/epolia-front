<template>
  <div
    class="relative grid min-h-12 min-w-0 content-start gap-epolia-xs rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-lg text-start wrap-anywhere text-epolia-text shadow-sm motion-safe:transition-colors hover:border-epolia-primary hover:bg-epolia-secondary-hover has-active:bg-epolia-secondary-active has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-epolia-focus has-aria-pressed:border-epolia-primary has-aria-pressed:bg-epolia-secondary-active has-aria-pressed:inset-ring-1 has-aria-pressed:inset-ring-epolia-primary forced-colors:border-2 forced-colors:has-aria-pressed:border-dashed"
  >
    <BaseTitle :id="`${id}-title`" level="h2">{{ title }}</BaseTitle>
    <p :id="`${id}-description`" class="text-epolia-body-small text-epolia-text-secondary">
      {{ description }}
    </p>
    <button
      type="button"
      :aria-labelledby="`${id}-title`"
      :aria-describedby="`${id}-description`"
      :aria-pressed="selected"
      class="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline-none"
      @click="emit('click')"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

defineProps<{
  title: string
  description: string
  selected: boolean
}>()

const emit = defineEmits<{ click: [] }>()
const id = useId()
</script>
