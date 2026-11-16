<template>
  <div class="flex min-w-0 flex-col gap-epolia-xs">
    <label :for="inputId" class="text-epolia-body font-semibold break-words text-epolia-text">
      {{ label }}
    </label>
    <div class="relative">
      <div
        class="grid gap-epolia-xs"
        :style="{ gridTemplateColumns: `repeat(${codeLength}, minmax(0, 1fr))` }"
        aria-hidden="true"
      >
        <span
          v-for="(digit, index) in cells"
          :key="index"
          class="base-code-cell flex min-h-14 items-center justify-center rounded-lg border text-epolia-body font-semibold text-epolia-text"
          :class="[
            error
              ? 'is-error border-epolia-error outline-epolia-error'
              : disabled
                ? 'border-epolia-input-disabled-border'
                : 'border-epolia-primary outline-epolia-primary',
            disabled ? 'bg-epolia-input-disabled' : 'bg-epolia-surface',
            focused && index === activeIndex && 'is-active outline-2 -outline-offset-2',
          ]"
          >{{ digit }}</span
        >
      </div>
      <input
        :id="inputId"
        ref="control"
        :value="model"
        :name="name"
        :disabled="disabled"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]*"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        class="absolute inset-0 size-full cursor-text border-0 bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
        @input="update"
        @focus="focused = true"
        @blur="focused = false"
      />
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
      class="rounded-lg bg-epolia-alert-error-surface p-epolia-sm text-epolia-body-small break-words text-epolia-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<script lang="ts">
/** Number of digits of a verification code, shared with the screens that check it. */
export const codeLength = 6
</script>

<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    id?: string
    name?: string
    help?: string
    error?: string
    disabled?: boolean
  }>(),
  { id: undefined, name: undefined, help: undefined, error: undefined, disabled: false },
)

const model = defineModel<string>({ required: true })

const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const control = useTemplateRef('control')
const focused = ref(false)
const cells = computed(() =>
  Array.from({ length: codeLength }, (_, index) => model.value[index] ?? ''),
)
// The next empty box shows where the next digit goes; the last one stays active when full.
const activeIndex = computed(() => Math.min(model.value.length, codeLength - 1))
const describedBy = computed(
  () =>
    [props.help && `${inputId.value}-help`, props.error && `${inputId.value}-error`]
      .filter(Boolean)
      .join(' ') || undefined,
)

// Keeps digits only, so a pasted "482 917" or a code with letters gives "482917".
// No maxlength on the field: it would cut "482 917" to "482 91" before this filter runs.
function update() {
  const input = control.value
  if (!input) return
  const digits = input.value.replace(/\D/g, '').slice(0, codeLength)
  input.value = digits
  model.value = digits
}

defineExpose({ focus: () => control.value?.focus() })
</script>

<!--
  The real field covers the boxes (utility classes on the input): tapping anywhere focuses it,
  and pasting and code autofill work. Utilities are used because Tailwind's base reset wins
  over this file's component layer for borders and form fields.
-->
<style scoped>
@layer components {
  @media (forced-colors: active) {
    .base-code-cell.is-active {
      outline-color: Highlight;
    }
  }
}
</style>
