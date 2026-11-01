<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  watchPostEffect,
} from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  ListboxRoot,
  ListboxContent,
  ListboxItem,
  ListboxItemIndicator,
} from 'reka-ui'
import BaseTag from '@/shared/components/BaseTag.vue'
import type { SelectOption } from '@/shared/components/BaseSelect.vue'

defineOptions({ inheritAttrs: false })
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
    placeholder: 'Choisir des options',
    required: false,
    disabled: false,
    clearable: true,
  },
)
const model = defineModel<string[]>({ required: true })
const attrs = useAttrs()
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const trigger = useTemplateRef<InstanceType<typeof PopoverTrigger>>('trigger')
const control = useTemplateRef<globalThis.HTMLSelectElement>('control')
const panel = useTemplateRef<globalThis.HTMLDivElement>('panel')
const tags = useTemplateRef<globalThis.HTMLUListElement>('tags')
const open = ref(false)
const invalid = ref(false)
const announcement = ref('')
let leavingWithTab = false
let pendingFocus: { values: string[]; index?: number } | undefined
const values = computed(() => [...new Set(model.value)])
const optionsByValue = computed(
  () => new Map(props.options.map((option) => [option.value, option])),
)
const selectedOptions = computed(() =>
  values.value.map((value) => ({
    value,
    label: optionsByValue.value.get(value)?.label ?? 'Option indisponible',
  })),
)
const hasUnavailableSelection = computed(() =>
  values.value.some((value) => !optionsByValue.value.has(value)),
)
const emptyMessage = computed(() =>
  !props.options.length
    ? 'Aucune option disponible.'
    : props.options.every((option) => option.disabled)
      ? 'Aucune option sélectionnable.'
      : undefined,
)
const showClear = computed(() => props.clearable && values.value.length > 0 && !props.disabled)
const summary = computed(() =>
  !values.value.length
    ? (emptyMessage.value ?? props.placeholder)
    : `${values.value.length} option${values.value.length > 1 ? 's' : ''} sélectionnée${values.value.length > 1 ? 's' : ''}`,
)
const displayedError = computed(
  () =>
    props.error ||
    (invalid.value
      ? hasUnavailableSelection.value
        ? 'Retirez les options indisponibles.'
        : 'Choisissez au moins une option.'
      : undefined),
)

function describedBy() {
  return [
    attrs['aria-describedby'],
    `${inputId.value}-hint`,
    props.help && `${inputId.value}-help`,
    hasUnavailableSelection.value && `${inputId.value}-unavailable`,
    displayedError.value && `${inputId.value}-error`,
  ]
    .filter(Boolean)
    .join(' ')
}

function updateSelection(value: unknown) {
  if (
    props.disabled ||
    !Array.isArray(value) ||
    !value.every((item): item is string => typeof item === 'string')
  )
    return
  const next = [...new Set(value)]
  // Previously selected unavailable values remain removable, but cannot be newly added.
  if (
    next.some(
      (item) =>
        !values.value.includes(item) &&
        (!optionsByValue.value.has(item) || optionsByValue.value.get(item)?.disabled),
    )
  )
    return
  model.value = next
}

const nativeSelection = computed({
  get: () => values.value.filter((value) => optionsByValue.value.has(value)),
  set: updateSelection,
})

function focusTrigger() {
  trigger.value?.$el.focus()
}

function remove(value: string) {
  if (props.disabled) return
  const index = values.value.indexOf(value)
  if (index < 0) return
  const label = selectedOptions.value[index]!.label
  const next = values.value.filter((item) => item !== value)
  pendingFocus = { values: next, index }
  model.value = next
  announcement.value = `${label} retiré.`
}

function clear() {
  if (props.disabled || !props.clearable) return
  pendingFocus = { values: [] }
  model.value = []
  announcement.value = 'Toutes les sélections ont été retirées.'
}

function focusOptions() {
  const content = panel.value
  const selected = content?.querySelector<globalThis.HTMLElement>(
    '[role="option"][aria-selected="true"]:not([aria-disabled="true"])',
  )
  const first = content?.querySelector<globalThis.HTMLElement>(
    '[role="option"]:not([aria-disabled="true"])',
  )
  ;(
    selected ??
    first ??
    content?.querySelector<globalThis.HTMLElement>('[role="listbox"]')
  )?.focus()
}

function onOpenAutoFocus(event: globalThis.Event) {
  event.preventDefault()
  focusOptions()
}

function onPanelTab(event: globalThis.KeyboardEvent) {
  // Resume native tab order from the field instead of looping within the portal.
  event.stopPropagation()
  leavingWithTab = true
  focusTrigger()
  open.value = false
}

function onCloseAutoFocus(event: globalThis.Event) {
  if (leavingWithTab) event.preventDefault()
  leavingWithTab = false
}

function onInvalid(event: globalThis.Event) {
  event.preventDefault()
  invalid.value = true
  const element = control.value
  const firstInvalid = Array.from(element?.form?.elements ?? []).find((field) => {
    const candidate = field as globalThis.HTMLInputElement
    return candidate.willValidate && !candidate.validity.valid
  })
  if (firstInvalid && firstInvalid !== element) return
  globalThis.setTimeout(() => {
    if (invalid.value && control.value === element) focusTrigger()
  }, 0)
}

// A controlled parent can apply the emitted value after this event's next tick.
watch(values, async (next) => {
  const intent = pendingFocus
  pendingFocus = undefined
  if (
    !intent ||
    next.length !== intent.values.length ||
    next.some((value, i) => value !== intent.values[i])
  )
    return
  await nextTick()
  if (props.disabled) return
  const buttons =
    tags.value?.querySelectorAll<globalThis.HTMLButtonElement>('button:not(:disabled)')
  const target =
    intent.index === undefined ? undefined : buttons?.[Math.min(intent.index, buttons.length - 1)]
  if (target) target.focus()
  else focusTrigger()
})

watch([values, () => props.required, () => props.disabled], () => {
  invalid.value = false
  if (props.disabled) open.value = false
})
watchPostEffect(() => {
  control.value?.setCustomValidity(
    hasUnavailableSelection.value ? 'Retirez les options indisponibles.' : '',
  )
})
watchPostEffect((onCleanup) => {
  const element = control.value
  if (!element) return
  const reset = (event: globalThis.Event) => {
    if (event.target !== element.form) return
    globalThis.setTimeout(() => {
      if (!event.defaultPrevented && control.value === element) {
        model.value = Array.from(element.selectedOptions, (option) => option.value)
        invalid.value = false
        announcement.value = ''
        open.value = false
      }
    }, 0)
  }
  element.ownerDocument.addEventListener('reset', reset, true)
  onCleanup(() => element.ownerDocument.removeEventListener('reset', reset, true))
})
</script>

<template>
  <div class="multi-field">
    <label :id="`${inputId}-label`" :for="inputId" class="text-epolia-body font-semibold">
      {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </label>
    <p :id="`${inputId}-hint`" class="text-epolia-body-small text-epolia-text-secondary">
      Plusieurs choix possibles.<template v-if="required"> Au moins un choix est requis.</template>
    </p>
    <PopoverRoot v-model:open="open">
      <div class="multi-control">
        <PopoverTrigger ref="trigger" as-child>
          <button
            v-bind="attrs"
            :id="inputId"
            :disabled="disabled"
            :aria-labelledby="`${inputId}-label ${inputId}-value`"
            :aria-describedby="describedBy()"
            :aria-invalid="
              displayedError ? true : (attrs['aria-invalid'] as 'true' | 'false' | undefined)
            "
            class="multi-trigger"
            :class="{ 'multi-invalid': displayedError, 'multi-has-clear': showClear }"
          >
            <span
              :id="`${inputId}-value`"
              class="multi-value"
              :class="{ 'multi-placeholder': !values.length }"
              >{{ summary }}</span
            >
            <span aria-hidden="true" class="multi-arrow" />
          </button>
        </PopoverTrigger>
        <button
          v-if="showClear"
          type="button"
          class="multi-clear"
          :aria-label="`Effacer toutes les sélections de ${label}`"
          @click="clear"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <PopoverPortal>
        <PopoverContent
          :side-offset="8"
          :collision-padding="16"
          prioritize-position
          sticky="always"
          as-child
          @open-auto-focus="onOpenAutoFocus"
          @close-auto-focus="onCloseAutoFocus"
        >
          <div
            ref="panel"
            class="epolia-multi-panel"
            :aria-labelledby="`${inputId}-panel-title`"
            @keydown.tab.capture="onPanelTab"
          >
            <p :id="`${inputId}-panel-title`" class="shrink-0 text-epolia-body font-semibold">
              {{ label }}
            </p>
            <ListboxRoot
              :model-value="values"
              multiple
              selection-behavior="toggle"
              :disabled="disabled"
              class="multi-options"
              @update:model-value="updateSelection"
            >
              <ListboxContent :aria-label="label">
                <ListboxItem
                  v-for="option in options"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                  :aria-disabled="option.disabled || undefined"
                  class="multi-option"
                >
                  <span>{{ option.label }}</span>
                  <ListboxItemIndicator aria-hidden="true" class="multi-check"
                    >✓</ListboxItemIndicator
                  >
                </ListboxItem>
              </ListboxContent>
            </ListboxRoot>
            <p v-if="emptyMessage" class="text-epolia-body-small text-epolia-text-secondary">
              {{ emptyMessage }}
            </p>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
    <select
      ref="control"
      v-model="nativeSelection"
      multiple
      :name="name"
      :form="form"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      class="multi-native"
      @invalid="onInvalid"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ul
      v-if="selectedOptions.length"
      ref="tags"
      :aria-label="`Sélections : ${label}`"
      class="multi-tags"
    >
      <li v-for="option in selectedOptions" :key="option.value" class="min-w-0 max-w-full">
        <BaseTag
          :label="option.label"
          clearable
          :disabled="disabled"
          @remove="remove(option.value)"
        />
      </li>
    </ul>
    <p
      v-if="hasUnavailableSelection"
      :id="`${inputId}-unavailable`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      Une sélection n’est plus disponible. Retirez les options indisponibles pour continuer.
    </p>
    <p
      v-if="help"
      :id="`${inputId}-help`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      {{ help }}
    </p>
    <p
      v-if="displayedError"
      :id="`${inputId}-error`"
      class="text-epolia-body-small text-epolia-error"
    >
      Erreur : {{ displayedError }}
    </p>
    <p role="status" class="sr-only">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.multi-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-epolia-xs);
  min-width: 0;
  color: var(--color-epolia-text);
  overflow-wrap: anywhere;
}
.multi-control {
  position: relative;
}
.multi-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-epolia-sm);
  min-height: 48px;
  padding: var(--spacing-epolia-sm);
  border: 1px solid var(--color-epolia-primary);
  border-radius: var(--radius);
  background: var(--color-epolia-surface);
  font: inherit;
  text-align: start;
  cursor: pointer;
}
.multi-value {
  min-width: 0;
}
.multi-has-clear .multi-value {
  padding-inline-end: calc(48px + var(--spacing-epolia-xs));
}
.multi-clear {
  position: absolute;
  inset-inline-end: 2rem;
  top: 50%;
  transform: translateY(-50%);
}
.multi-clear {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  color: var(--color-epolia-primary);
  font-size: 1.5rem;
  cursor: pointer;
}
.multi-clear:active {
  background: var(--color-epolia-secondary-active);
}
.multi-clear:focus-visible {
  outline: 2px solid var(--color-epolia-primary);
  outline-offset: 2px;
}
.multi-trigger:focus-visible,
.multi-trigger[data-state='open'] {
  outline: 2px solid var(--color-epolia-primary);
  outline-offset: -2px;
}
.multi-trigger:disabled {
  border-color: var(--color-epolia-input-disabled-border);
  background: var(--color-epolia-input-disabled);
  cursor: not-allowed;
}
.multi-invalid {
  border-color: var(--color-epolia-error);
}
.multi-invalid:focus-visible,
.multi-invalid[data-state='open'] {
  outline-color: var(--color-epolia-error);
}
.multi-placeholder {
  color: var(--color-epolia-text-secondary);
}
.multi-arrow {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-inline-end: 2px solid var(--color-epolia-primary);
  border-bottom: 2px solid var(--color-epolia-primary);
  transform: translateY(-0.125rem) rotate(45deg);
}
.multi-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-epolia-xs);
  min-width: 0;
}
.multi-native {
  position: absolute;
  width: 1px;
  height: 1px;
  clip-path: inset(50%);
  overflow: hidden;
}
:global(.epolia-multi-panel) {
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-epolia-xs);
  width: var(--reka-popover-trigger-width);
  max-width: calc(100vw - 2 * var(--spacing-epolia-md));
  max-height: var(--reka-popover-content-available-height);
  padding: var(--spacing-epolia-xs);
  border: 1px solid var(--color-epolia-primary);
  border-radius: var(--radius);
  background: var(--color-epolia-surface);
  color: var(--color-epolia-text);
  font-family: var(--font-epolia-body);
  font-size: var(--text-epolia-body);
  line-height: var(--text-epolia-body--line-height);
  overflow-wrap: anywhere;
}
.multi-options {
  min-height: 0;
  overflow-y: auto;
}
.multi-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-epolia-xs);
  min-height: 48px;
  padding: var(--spacing-epolia-sm);
  border-radius: var(--radius);
  cursor: pointer;
}
.multi-option > span:first-child {
  min-width: 0;
}
.multi-option[data-highlighted],
.multi-option:hover:not([data-disabled]) {
  outline: none;
  background: var(--color-epolia-secondary-hover);
}
.multi-option[data-disabled] {
  color: var(--color-epolia-text-secondary);
  cursor: not-allowed;
}
.multi-check {
  flex-shrink: 0;
  color: var(--color-epolia-primary);
}
@media (forced-colors: active) {
  .multi-trigger {
    border-color: ButtonText;
  }
  .multi-trigger:focus-visible,
  .multi-trigger[data-state='open'] {
    outline-color: Highlight;
  }
  .multi-option[data-highlighted] {
    background: Highlight;
    color: HighlightText;
    forced-color-adjust: none;
  }
  .multi-check {
    color: currentColor;
  }
}
</style>
