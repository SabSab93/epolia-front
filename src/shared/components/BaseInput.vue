<script setup lang="ts">
import { computed, useAttrs, useId, useTemplateRef, type InputHTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    ariaLabel?: string
    clearable?: boolean
    id?: string
    type?: 'text' | 'email'
    name?: string
    autocomplete?: string
    inputmode?: InputHTMLAttributes['inputmode']
    help?: string
    error?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    label: undefined,
    ariaLabel: undefined,
    clearable: true,
    id: undefined,
    type: 'text',
    name: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    help: undefined,
    error: undefined,
    required: false,
    disabled: false,
    readonly: false,
  },
)

const model = defineModel<string>({ required: true })
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const attrs = useAttrs()
const input = useTemplateRef('input')

function clear() {
  model.value = ''
  input.value?.focus()
}

function describedBy() {
  return (
    [
      attrs['aria-describedby'],
      props.help ? `${inputId.value}-help` : undefined,
      props.error ? `${inputId.value}-error` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  )
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-epolia-xs">
    <label
      v-if="label"
      :for="inputId"
      class="text-epolia-body font-semibold break-words text-epolia-text"
    >
      {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </label>
    <div
      class="flex min-w-0 items-center gap-epolia-xs rounded-lg border border-epolia-primary bg-epolia-surface focus-within:ring-2 focus-within:ring-epolia-focus focus-within:ring-offset-2 focus-within:ring-offset-epolia-page"
    >
      <input
        v-bind="attrs"
        :id="inputId"
        ref="input"
        v-model="model"
        :type="type"
        :name="name"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :aria-label="ariaLabel ?? (attrs['aria-label'] as string | undefined)"
        :aria-describedby="describedBy()"
        :aria-invalid="
          error ? true : (attrs['aria-invalid'] as InputHTMLAttributes['aria-invalid'])
        "
        class="min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-epolia-sm py-epolia-sm text-epolia-body text-epolia-text placeholder:text-epolia-text-secondary focus:outline-none disabled:cursor-not-allowed"
      />
      <button
        v-if="clearable && model && !disabled && !readonly"
        type="button"
        :aria-label="`Effacer le champ ${label || ariaLabel || attrs['aria-label'] || ''}`.trim()"
        class="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg text-epolia-body text-epolia-primary hover:bg-epolia-secondary-hover active:bg-epolia-secondary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-focus"
        @click="clear"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <p
      v-if="help"
      :id="`${inputId}-help`"
      class="text-epolia-body-small break-words text-epolia-text-secondary"
    >
      {{ help }}
    </p>
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="text-epolia-body-small break-words text-epolia-error"
    >
      <span class="font-semibold">Erreur :</span> {{ error }}
    </p>
  </div>
</template>
