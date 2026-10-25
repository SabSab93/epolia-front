<script setup lang="ts">
import { computed, useAttrs, useId, useTemplateRef, type InputHTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    ariaLabel?: string
    clearable?: boolean
    id?: string
    type?: 'text' | 'email' | 'date' | 'textarea'
    rows?: number
    name?: string
    autocomplete?: string
    placeholder?: string
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
    rows: 4,
    name: undefined,
    autocomplete: undefined,
    placeholder: undefined,
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
const stateDescription = computed(() =>
  props.disabled ? 'Champ désactivé.' : props.readonly ? 'Lecture seule.' : undefined,
)
const control = useTemplateRef('control')
const controlClasses =
  'min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-epolia-sm py-epolia-sm text-epolia-body text-epolia-text placeholder:text-epolia-text-secondary focus:outline-none disabled:cursor-not-allowed'

function clear() {
  model.value = ''
  control.value?.focus()
}

function controlAttributes() {
  return {
    ...attrs,
    id: inputId.value,
    name: props.name,
    autocomplete: props.autocomplete,
    placeholder: props.placeholder,
    inputmode: props.inputmode,
    required: props.required,
    disabled: props.disabled,
    readonly: props.readonly,
    'aria-label': props.ariaLabel ?? (attrs['aria-label'] as string | undefined),
    'aria-describedby': describedBy(),
    'aria-invalid': props.error
      ? true
      : (attrs['aria-invalid'] as InputHTMLAttributes['aria-invalid']),
  }
}

function describedBy() {
  return (
    [
      attrs['aria-describedby'],
      stateDescription.value ? `${inputId.value}-state` : undefined,
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
      class="flex min-w-0 items-start gap-epolia-xs rounded-lg border focus-within:outline-2 focus-within:-outline-offset-2"
      :class="[
        disabled
          ? 'bg-epolia-input-disabled'
          : readonly
            ? 'bg-epolia-input-readonly'
            : 'bg-epolia-surface',
        error
          ? 'border-epolia-error focus-within:outline-epolia-error'
          : disabled
            ? 'border-epolia-input-disabled-border'
            : 'border-epolia-primary focus-within:outline-epolia-primary',
      ]"
    >
      <textarea
        v-if="type === 'textarea'"
        v-bind="controlAttributes()"
        ref="control"
        v-model="model"
        :rows="rows"
        :class="[controlClasses, 'resize-y']"
      />
      <input
        v-else
        v-bind="controlAttributes()"
        ref="control"
        v-model="model"
        :type="type"
        :class="controlClasses"
      />
      <button
        v-if="clearable && model && !disabled && !readonly"
        type="button"
        :aria-label="`Effacer le champ ${label || ariaLabel || attrs['aria-label'] || ''}`.trim()"
        class="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg text-epolia-body text-epolia-primary hover:bg-epolia-secondary-hover active:bg-epolia-secondary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-primary"
        @click="clear"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <p
      v-if="stateDescription"
      :id="`${inputId}-state`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      {{ stateDescription }}
    </p>
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
      Erreur : {{ error }}
    </p>
  </div>
</template>
