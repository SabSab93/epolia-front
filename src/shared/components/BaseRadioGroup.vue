<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

const props = defineProps<{
  legend: string
  options: readonly RadioOption[]
  id?: string
  name?: string
  help?: string
  error?: string
  required?: boolean
  disabled?: boolean
  optionClass?: string
}>()

const model = defineModel<string | undefined>({ required: true })
const generatedId = useId()
const groupId = computed(() => props.id ?? generatedId)
const groupName = computed(() => props.name ?? groupId.value)
const attrs = useAttrs()
function descriptions() {
  return (
    [
      attrs['aria-describedby'],
      props.help && `${groupId.value}-help`,
      props.error && `${groupId.value}-error`,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

function select(option: RadioOption) {
  if (!props.disabled && !option.disabled && model.value !== option.value) {
    model.value = option.value
  }
}
</script>

<template>
  <fieldset
    v-bind="attrs"
    :id="groupId"
    :disabled="disabled"
    :aria-describedby="descriptions()"
    class="radio-group"
  >
    <legend class="text-epolia-body font-semibold">
      {{ legend }}<span v-if="required" aria-hidden="true" class="ms-epolia-2xs">*</span>
    </legend>
    <p
      v-if="help"
      :id="`${groupId}-help`"
      class="text-epolia-body-small text-epolia-text-secondary"
    >
      {{ help }}
    </p>
    <div class="radio-options">
      <label
        v-for="(option, index) in options"
        :key="option.value"
        :for="`${groupId}-${index}`"
        class="radio-option"
        :class="optionClass"
      >
        <span class="radio-target">
          <input
            :id="`${groupId}-${index}`"
            type="radio"
            :name="groupName"
            :value="option.value"
            :checked="model === option.value"
            :required="required"
            :disabled="disabled || option.disabled"
            :aria-labelledby="`${groupId}-${index}-label`"
            :aria-invalid="error ? true : undefined"
            :aria-describedby="
              [
                descriptions(),
                option.description || $slots.description
                  ? `${groupId}-${index}-description`
                  : undefined,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            "
            class="radio-control"
            @change="select(option)"
          />
        </span>
        <span class="radio-content">
          <span :id="`${groupId}-${index}-label`" class="text-epolia-body">{{ option.label }}</span>
          <span
            v-if="option.description || $slots.description"
            :id="`${groupId}-${index}-description`"
            class="block text-epolia-body-small text-epolia-text-secondary"
          >
            <slot
              name="description"
              :option="option"
              :selected="model === option.value"
              :disabled="disabled || option.disabled"
            >
              {{ option.description }}
            </slot>
          </span>
        </span>
      </label>
    </div>
    <p v-if="error" :id="`${groupId}-error`" class="text-epolia-body-small text-epolia-error">
      Erreur : {{ error }}
    </p>
  </fieldset>
</template>

<style scoped>
.radio-group {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--color-epolia-text);
  overflow-wrap: anywhere;
}

.radio-group > legend {
  max-width: 100%;
  padding: 0;
}

.radio-group > p,
.radio-options {
  margin-top: var(--spacing-epolia-xs);
}

.radio-options {
  display: grid;
  gap: var(--spacing-epolia-xs);
}

.radio-option {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: var(--spacing-epolia-xs);
  min-height: 48px;
  cursor: pointer;
}

.radio-option:has(:disabled) {
  cursor: not-allowed;
}

.radio-target {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.radio-content {
  min-width: 0;
  padding-block: var(--spacing-epolia-sm);
}

.radio-control {
  appearance: none;
  display: grid;
  place-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  border: 2px solid var(--color-epolia-primary);
  border-radius: 50%;
  background: var(--color-epolia-surface);
  color: var(--color-epolia-primary);
  cursor: inherit;
}

.radio-control:checked::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
}

.radio-control:enabled:hover {
  background: var(--color-epolia-secondary-hover);
}

.radio-control:enabled:active {
  background: var(--color-epolia-secondary-active);
}

.radio-control:focus-visible {
  outline: 2px solid var(--color-epolia-focus);
  outline-offset: 2px;
}

.radio-control[aria-invalid='true']:enabled {
  border-color: var(--color-epolia-error);
}

.radio-control:disabled {
  border-color: var(--color-epolia-input-disabled-border);
  background: var(--color-epolia-input-disabled);
  color: var(--color-epolia-text);
}

@media (forced-colors: active) {
  .radio-control {
    appearance: auto;
  }

  .radio-control:checked::before {
    content: none;
  }
}
</style>
