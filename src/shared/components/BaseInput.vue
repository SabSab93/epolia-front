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
  type InputHTMLAttributes,
} from 'vue'
import eyeOpen from '@/assets/svg/eye-open.svg'
import eyeClosed from '@/assets/svg/eye-closed.svg'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    ariaLabel?: string
    clearable?: boolean
    id?: string
    type?: 'text' | 'email' | 'date' | 'textarea' | 'password'
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
const passwordVisible = ref(false)
const passwordIcon = computed(() => `url("${passwordVisible.value ? eyeOpen : eyeClosed}")`)
const nativeType = computed(() =>
  props.type === 'password' && passwordVisible.value ? 'text' : props.type,
)
const passwordAction = computed(() => (passwordVisible.value ? 'Masquer' : 'Afficher'))
const fieldName = computed(
  () => props.label || props.ariaLabel || attrs['aria-label'] || 'le mot de passe',
)
const controlClasses =
  'min-h-12 min-w-0 flex-1 rounded-lg bg-transparent px-epolia-sm py-epolia-sm text-epolia-body text-epolia-text placeholder:text-epolia-text-secondary focus:outline-none disabled:cursor-not-allowed'

function clear() {
  model.value = ''
  control.value?.focus()
}

async function togglePassword() {
  const element = control.value
  if (props.type !== 'password' || props.disabled || !element) return
  const { selectionStart, selectionEnd, selectionDirection } = element
  passwordVisible.value = !passwordVisible.value
  await nextTick()
  if (
    control.value === element &&
    props.type === 'password' &&
    selectionStart !== null &&
    selectionEnd !== null
  ) {
    element.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? 'none')
  }
}

watch([() => props.type, () => props.disabled], () => {
  passwordVisible.value = false
})
watch(model, (value) => {
  if (!value) passwordVisible.value = false
})
watchPostEffect((onCleanup) => {
  const element = control.value
  if (!element) return
  const reset = (event: globalThis.Event) => {
    if (event.target !== element.form) return
    globalThis.setTimeout(() => {
      if (event.defaultPrevented || control.value !== element) return
      model.value = element.value
      passwordVisible.value = false
    }, 0)
  }
  element.ownerDocument.addEventListener('reset', reset, true)
  onCleanup(() => element.ownerDocument.removeEventListener('reset', reset, true))
})

function controlAttributes() {
  return {
    ...attrs,
    ...(props.type === 'password'
      ? { spellcheck: false, autocapitalize: 'none', autocorrect: 'off' }
      : {}),
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
        type === 'password' && 'flex-wrap',
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
        :type="nativeType"
        :class="[controlClasses, type === 'password' && 'password-control']"
      />
      <button
        v-if="clearable && model && !disabled && !readonly"
        type="button"
        :aria-label="`Effacer le champ ${label || ariaLabel || attrs['aria-label'] || ''}`.trim()"
        class="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg text-epolia-body text-epolia-primary active:bg-epolia-secondary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-primary"
        @click="clear"
      >
        <span aria-hidden="true" class="text-2xl leading-none">×</span>
      </button>
      <button
        v-if="type === 'password'"
        type="button"
        :aria-label="`${passwordAction} ${fieldName}`"
        :aria-controls="inputId"
        :disabled="disabled"
        class="password-toggle"
        @click="togglePassword"
      >
        <span
          aria-hidden="true"
          class="password-icon"
          :style="{ '--password-icon': passwordIcon }"
        />
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

<style scoped>
.password-control {
  flex-basis: 8rem;
}
.password-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  min-height: 3rem;
  border-radius: var(--radius);
  color: var(--color-epolia-primary);
  cursor: pointer;
  touch-action: manipulation;
}
.password-icon {
  width: 1.5rem;
  height: 1.5rem;
  background-color: currentColor;
  -webkit-mask: var(--password-icon) center / contain no-repeat;
  mask: var(--password-icon) center / contain no-repeat;
}
.password-toggle:focus-visible {
  outline: 2px solid var(--color-epolia-primary);
  outline-offset: 2px;
}
.password-toggle:active {
  background: var(--color-epolia-secondary-active);
}
.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (forced-colors: active) {
  .password-icon {
    background-color: ButtonText;
    forced-color-adjust: none;
  }
  .password-toggle:disabled .password-icon {
    background-color: GrayText;
  }
}
</style>
