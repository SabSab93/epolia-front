<template>
  <div class="flex min-w-0 flex-col gap-epolia-xs">
    <label :for="id" class="text-epolia-body font-semibold">
      {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </label>
    <ComboboxRoot
      v-model:open="open"
      class="relative"
      :model-value="selected || null"
      ignore-filter
      open-on-click
      :reset-search-term-on-select="false"
      :reset-search-term-on-blur="false"
      @highlight="onHighlight"
    >
      <ComboboxInput
        :id="id"
        v-model="query"
        :aria-required="required || undefined"
        :aria-describedby="message ? id + '-message' : undefined"
        :placeholder="placeholder"
        :maxlength="maxlength"
        class="base-search-input min-h-12 w-full rounded-lg border border-epolia-primary bg-epolia-surface ps-epolia-2xl pe-epolia-sm text-epolia-body focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-epolia-primary"
      />
      <p
        v-if="message"
        :id="id + '-message'"
        role="status"
        class="mt-epolia-xs text-epolia-body-small break-words"
        :class="messageType === 'error' ? 'text-epolia-error' : 'text-epolia-text-secondary'"
      >
        {{ message }}
      </p>
      <ComboboxContent
        :aria-label="resultsLabel"
        :class="
          hasOptions
            ? [
                'mt-epolia-2xs max-h-64 w-full overflow-y-auto rounded-lg border border-epolia-primary bg-epolia-surface p-epolia-2xs',
                overlay && 'absolute z-10',
              ]
            : 'sr-only'
        "
        @scroll.passive="onScroll"
      >
        <!-- Keep option rows at their natural height inside Reka’s scrollable flex column. -->
        <div class="shrink-0">
          <slot />
        </div>
      </ComboboxContent>
    </ComboboxRoot>
  </div>
</template>

<script setup lang="ts">
import { ComboboxRoot, ComboboxContent, ComboboxInput } from 'reka-ui'

defineProps<{
  id: string
  label: string
  placeholder: string
  maxlength?: number
  required?: boolean
  selected?: string
  resultsLabel: string
  hasOptions: boolean
  overlay?: boolean
  message?: string
  messageType?: 'info' | 'error'
}>()
const query = defineModel<string>({ required: true })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ reachEnd: [] }>()

function onScroll(event: globalThis.Event) {
  const list = event.currentTarget as globalThis.HTMLElement
  if (list.scrollTop + list.clientHeight >= list.scrollHeight - 1) emit('reachEnd')
}

function onHighlight(item?: { ref: globalThis.HTMLElement }) {
  if (item && !item.ref.nextElementSibling) emit('reachEnd')
}
</script>

<style scoped>
.base-search-input {
  background-image: url('@/assets/svg/study-search.svg');
  background-repeat: no-repeat;
  background-position: left var(--spacing-epolia-md) center;
}
</style>
