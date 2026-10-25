<script setup lang="ts">
import { computed, useAttrs, useId, type InputHTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    id?: string
    name?: string
    help?: string
    error?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    id: undefined,
    name: undefined,
    help: undefined,
    error: undefined,
    required: false,
    disabled: false,
  },
)

const model = defineModel<boolean>({ required: true })
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const attrs = useAttrs()

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
  <div class="checkbox-layout grid min-w-0 gap-x-epolia-xs">
    <label
      :for="inputId"
      class="checkbox-layout col-span-2 grid min-h-12 items-start gap-x-epolia-xs rounded-lg text-epolia-body text-epolia-text"
      :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
    >
      <span class="flex size-12 items-center justify-center">
        <input
          v-bind="attrs"
          :id="inputId"
          v-model="model"
          type="checkbox"
          :name="name"
          :required="required"
          :disabled="disabled"
          :aria-describedby="describedBy()"
          :aria-invalid="
            error ? true : (attrs['aria-invalid'] as InputHTMLAttributes['aria-invalid'])
          "
          class="checkbox m-0 size-6 shrink-0 cursor-inherit rounded-sm border-2 bg-epolia-surface text-epolia-primary-text checked:bg-epolia-primary enabled:hover:bg-epolia-secondary-hover enabled:active:bg-epolia-secondary-active enabled:checked:hover:bg-epolia-primary-hover enabled:checked:active:bg-epolia-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-focus disabled:border-epolia-input-disabled-border disabled:bg-epolia-input-disabled disabled:text-epolia-text disabled:checked:bg-epolia-input-disabled-border"
          :class="error && !disabled ? 'border-epolia-error' : 'border-epolia-primary'"
        />
      </span>
      <span class="min-w-0 py-epolia-sm break-words">
        {{ label }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
      </span>
    </label>
    <div v-if="help || error" class="col-start-2 flex flex-col gap-epolia-2xs">
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
  </div>
</template>

<style scoped>
.checkbox-layout {
  grid-template-columns: 3rem minmax(0, 1fr);
}

.checkbox {
  appearance: none;
  display: grid;
  place-content: center;
}

.checkbox:checked::before {
  content: '';
  width: 0.375rem;
  height: 0.75rem;
  border: solid currentColor;
  border-width: 0 0.125rem 0.125rem 0;
  transform: translateY(-0.125rem) rotate(45deg);
}

/* Let the system render the control in high contrast mode. */
@media (forced-colors: active) {
  .checkbox {
    appearance: auto;
  }

  .checkbox:checked::before {
    content: none;
  }
}
</style>
