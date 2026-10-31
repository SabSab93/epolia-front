<script setup lang="ts">
import {
  computed,
  useAttrs,
  useId,
  useTemplateRef,
  watchPostEffect,
  type SelectHTMLAttributes,
} from 'vue'

defineOptions({ inheritAttrs: false })

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    label: string
    options: readonly SelectOption[]
    id?: string
    name?: string
    form?: string
    placeholder?: string
    help?: string
    error?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    id: undefined,
    name: undefined,
    form: undefined,
    help: undefined,
    error: undefined,
    placeholder: 'Choisir une option',
    required: false,
    disabled: false,
  },
)

const model = defineModel<string>({ required: true })
const attrs = useAttrs()
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const control = useTemplateRef<globalThis.HTMLSelectElement>('control')
const selectedOption = computed(() => props.options.find((option) => option.value === model.value))
const unavailable = computed(() => !props.options.some((option) => !option.disabled))
const isDisabled = computed(() => props.disabled || unavailable.value)
const unavailableMessage = computed(() =>
  !props.options.length
    ? 'Aucune option disponible.'
    : unavailable.value
      ? 'Aucune option sélectionnable.'
      : undefined,
)
const emptyLabel = computed(() => unavailableMessage.value ?? props.placeholder)
const stateDescription = computed(() =>
  selectedOption.value ? unavailableMessage.value : undefined,
)
const selection = computed({
  get: () => (selectedOption.value ? model.value : ''),
  set(value: string) {
    if (
      !isDisabled.value &&
      (value === ''
        ? !props.required
        : props.options.some((option) => option.value === value && !option.disabled))
    ) {
      model.value = value
    }
  },
})

function describedBy() {
  return (
    [
      attrs['aria-describedby'],
      props.help && `${inputId.value}-help`,
      stateDescription.value && `${inputId.value}-state`,
      props.error && `${inputId.value}-error`,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

// A native reset does not emit change; keep the decorative value synchronized.
watchPostEffect((onCleanup) => {
  const element = control.value
  const form = props.form ? element?.ownerDocument.getElementById(props.form) : element?.form
  if (!form || form.tagName !== 'FORM') return
  function reset(event: globalThis.Event) {
    globalThis.queueMicrotask(() => {
      if (!event.defaultPrevented && control.value) model.value = control.value.value
    })
  }
  form.addEventListener('reset', reset)
  onCleanup(() => form.removeEventListener('reset', reset))
})
</script>

<template>
  <div class="select-field">
    <label :for="inputId" class="text-epolia-body font-semibold">
      {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </label>
    <div class="select-surface" :class="{ 'select-invalid': error }">
      <span aria-hidden="true" class="select-value">{{ selectedOption?.label ?? emptyLabel }}</span>
      <span aria-hidden="true" class="select-arrow" />
      <select
        v-bind="attrs"
        :id="inputId"
        ref="control"
        v-model="selection"
        :name="name"
        :form="form"
        :required="required"
        :disabled="isDisabled"
        :aria-describedby="describedBy()"
        :aria-invalid="
          error ? true : (attrs['aria-invalid'] as SelectHTMLAttributes['aria-invalid'])
        "
        class="select-native"
      >
        <option value="" :disabled="required" selected>{{ emptyLabel }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
    <p
      v-if="help"
      :id="`${inputId}-help`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      {{ help }}
    </p>
    <p
      v-if="stateDescription"
      :id="`${inputId}-state`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      {{ stateDescription }}
    </p>
    <p v-if="error" :id="`${inputId}-error`" class="text-epolia-body-small text-epolia-error">
      Erreur : {{ error }}
    </p>
  </div>
</template>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-epolia-xs);
  min-width: 0;
  color: var(--color-epolia-text);
  overflow-wrap: anywhere;
}

.select-surface {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--spacing-epolia-sm);
  min-height: 48px;
  min-width: 48px;
  padding: var(--spacing-epolia-sm);
  border: 1px solid var(--color-epolia-primary);
  border-radius: var(--radius);
  background: var(--color-epolia-surface);
  font-family: var(--font-epolia-body);
  font-size: var(--text-epolia-body);
  line-height: var(--text-epolia-body--line-height);
}

.select-surface:has(select:focus-visible) {
  outline: 2px solid var(--color-epolia-focus);
  outline-offset: 2px;
}

.select-invalid {
  border-color: var(--color-epolia-error);
}

.select-surface:has(select:disabled) {
  border-color: var(--color-epolia-input-disabled-border);
  background: var(--color-epolia-input-disabled);
}

.select-value {
  min-width: 0;
}

.select-arrow {
  width: 0.5rem;
  height: 0.5rem;
  margin-inline-end: var(--spacing-epolia-2xs);
  border-inline-end: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  color: var(--color-epolia-primary);
  transform: translateY(-0.125rem) rotate(45deg);
}

/* The only interactive control covers exactly its visible, multiline surface. */
.select-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
  font: inherit;
}

.select-native:disabled {
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .select-value,
  .select-arrow {
    display: none;
  }

  .select-native {
    position: static;
    grid-column: 1 / -1;
    min-width: 0;
    min-height: 48px;
    opacity: 1;
    appearance: auto;
  }

  .select-surface:has(select:focus-visible) {
    outline-color: Highlight;
  }
}
</style>
