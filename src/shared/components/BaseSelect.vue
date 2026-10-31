<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  watch,
  useAttrs,
  useId,
  useTemplateRef,
  watchPostEffect,
  type SelectHTMLAttributes,
} from 'vue'

import {
  SelectRoot,
  SelectTrigger,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from 'reka-ui'

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
    clearable?: boolean
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
    clearable: false,
  },
)

const model = defineModel<string>({ required: true })
const attrs = useAttrs()
const trigger = useTemplateRef<InstanceType<typeof SelectTrigger>>('trigger')
const invalid = ref(false)
const displayedError = computed(
  () => props.error || (invalid.value ? 'Choisissez une option.' : undefined),
)
function onInvalid(event: globalThis.Event) {
  event.preventDefault()
  invalid.value = true
  const element = control.value
  const firstInvalid = Array.from(element?.form?.elements ?? []).find((field) => {
    const candidate = field as globalThis.HTMLInputElement
    return candidate.willValidate && !candidate.validity.valid
  })
  if (firstInvalid && firstInvalid !== element) return
  // Let the browser finish validation before restoring focus to the visible control.
  globalThis.setTimeout(() => {
    if (invalid.value && control.value === element) trigger.value?.$el.focus()
  }, 0)
}
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const control = useTemplateRef<globalThis.HTMLSelectElement>('control')
const selectedOption = computed(() => props.options.find((option) => option.value === model.value))
const unavailable = computed(() => !props.options.some((option) => !option.disabled))
const isDisabled = computed(() => props.disabled || unavailable.value)
const showClear = computed(() => props.clearable && selectedOption.value && !isDisabled.value)
async function clearSelection() {
  if (!showClear.value) return
  model.value = ''
  await nextTick()
  trigger.value?.$el.focus()
}
watch([model, () => props.required, isDisabled], () => {
  invalid.value = false
})
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

// Reka reserves the empty string: use an internal value that cannot collide with options.
const emptyValue = computed(() => {
  let value = '__epolia_empty__'
  while (props.options.some((option) => option.value === value)) value += '_'
  return value
})
const menuSelection = computed({
  get: () => selection.value || emptyValue.value,
  set: (value: string) => {
    selection.value = value === emptyValue.value ? '' : value
  },
})

function describedBy() {
  return (
    [
      attrs['aria-describedby'],
      props.help && `${inputId.value}-help`,
      stateDescription.value && `${inputId.value}-state`,
      displayedError.value && `${inputId.value}-error`,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

// Native resets do not emit change; form association can also change after mount.
watchPostEffect((onCleanup) => {
  const element = control.value
  if (!element) return
  const root = element.ownerDocument
  const reset = (event: globalThis.Event) => {
    if (event.target !== element.form) return
    // Wait for the browser to complete the native reset default action.
    globalThis.setTimeout(() => {
      if (!event.defaultPrevented && control.value === element) {
        model.value = element.value
        invalid.value = false
      }
    }, 0)
  }
  root.addEventListener('reset', reset, true)
  onCleanup(() => root.removeEventListener('reset', reset, true))
})
</script>

<template>
  <div class="select-field">
    <label :for="inputId" class="text-epolia-body font-semibold">
      {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </label>
    <SelectRoot v-model="menuSelection" :disabled="isDisabled" :required="required">
      <div
        class="select-control"
        :class="{ 'select-invalid': displayedError, 'select-disabled': isDisabled }"
      >
        <SelectTrigger
          v-bind="attrs"
          :id="inputId"
          ref="trigger"
          :aria-describedby="describedBy()"
          :aria-invalid="
            displayedError ? true : (attrs['aria-invalid'] as SelectHTMLAttributes['aria-invalid'])
          "
          class="select-surface"
          :class="{ 'select-has-clear': showClear }"
        >
          <span class="select-value" :class="{ 'select-placeholder': !selectedOption }">{{
            selectedOption?.label ?? emptyLabel
          }}</span>
          <span aria-hidden="true" class="select-arrow" />
        </SelectTrigger>
        <button
          v-if="showClear"
          type="button"
          class="select-clear"
          :aria-label="`Effacer la sélection : ${label}`"
          @click="clearSelection"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <SelectPortal>
        <SelectContent position="popper" :side-offset="8" class="epolia-select-menu">
          <SelectViewport>
            <SelectItem v-if="!required" :value="emptyValue" class="select-option">
              <SelectItemText>{{ placeholder }}</SelectItemText>
              <SelectItemIndicator class="select-check" aria-hidden="true">✓</SelectItemIndicator>
            </SelectItem>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="select-option"
            >
              <SelectItemText>{{ option.label }}</SelectItemText>
              <SelectItemIndicator class="select-check" aria-hidden="true">✓</SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <!-- Form transport only: Reka owns all interaction; keep external form/reset support. -->
    <select
      ref="control"
      v-model="selection"
      :name="name"
      :form="form"
      :required="required"
      :disabled="isDisabled"
      :autocomplete="attrs.autocomplete as string"
      tabindex="-1"
      aria-hidden="true"
      class="select-native"
      @invalid="onInvalid"
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
    <p
      v-if="displayedError"
      :id="`${inputId}-error`"
      class="text-epolia-body-small text-epolia-error"
    >
      Erreur : {{ displayedError }}
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

.select-control {
  position: relative;
  min-width: 0;
  border: 1px solid var(--color-epolia-primary);
  border-radius: var(--radius);
  background: var(--color-epolia-surface);
}

.select-control:focus-within,
.select-control:has([data-state='open']) {
  outline: 2px solid var(--color-epolia-primary);
  outline-offset: -2px;
}

.select-invalid {
  border-color: var(--color-epolia-error);
}

.select-invalid:focus-within,
.select-invalid:has([data-state='open']) {
  outline-color: var(--color-epolia-error);
}

.select-disabled {
  border-color: var(--color-epolia-input-disabled-border);
  background: var(--color-epolia-input-disabled);
}

.select-clear {
  position: absolute;
  inset-inline-end: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  color: var(--color-epolia-primary);
  font-size: 1.5rem;
  cursor: pointer;
}

.select-clear:hover {
  background: var(--color-epolia-secondary-hover);
}

.select-clear:active {
  background: var(--color-epolia-secondary-active);
}

.select-clear:focus-visible {
  outline: 2px solid var(--color-epolia-primary);
  outline-offset: 2px;
}

.select-has-clear .select-value {
  padding-inline-end: calc(48px + var(--spacing-epolia-xs));
}

.select-surface {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--spacing-epolia-sm);
  min-height: 48px;
  min-width: 48px;
  padding: var(--spacing-epolia-sm);
  border-radius: var(--radius);
  background: transparent;
  font-family: var(--font-epolia-body);
  font-size: var(--text-epolia-body);
  line-height: var(--text-epolia-body--line-height);
  text-align: start;
  cursor: pointer;
}

.select-surface:focus-visible {
  outline: none;
}

.select-surface:disabled {
  cursor: not-allowed;
}

.select-placeholder {
  color: var(--color-epolia-text-secondary);
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

/* Native form transport stays out of the interaction and accessibility trees. */
.select-native {
  position: absolute;
  width: 1px;
  height: 1px;
  clip-path: inset(50%);
  overflow: hidden;
}

:global(.epolia-select-menu) {
  z-index: 50;
  width: var(--reka-select-trigger-width);
  max-width: calc(100vw - 2 * var(--spacing-epolia-md));
  max-height: var(--reka-select-content-available-height);
  overflow-y: auto;
  border: 1px solid var(--color-epolia-primary);
  border-radius: var(--radius);
  background: var(--color-epolia-surface);
  color: var(--color-epolia-text);
  padding: var(--spacing-epolia-2xs);
  font-family: var(--font-epolia-body);
  font-size: var(--text-epolia-body);
  line-height: var(--text-epolia-body--line-height);
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-epolia-xs);
  min-height: 48px;
  padding: var(--spacing-epolia-sm);
  border-radius: var(--radius);
  overflow-wrap: anywhere;
  cursor: pointer;
}

.select-option[data-highlighted] {
  outline: none;
  background: var(--color-epolia-secondary-hover);
}

.select-option[data-disabled] {
  color: var(--color-epolia-text-secondary);
  cursor: not-allowed;
}

.select-check {
  flex-shrink: 0;
  color: var(--color-epolia-primary);
}

@media (forced-colors: active) {
  .select-option[data-highlighted] {
    background: Highlight;
    color: HighlightText;
    forced-color-adjust: none;
  }
  .select-check {
    color: currentColor;
  }
}
</style>
