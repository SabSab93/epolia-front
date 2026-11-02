<script setup lang="ts">
import { computed } from 'vue'

export type StepperStatus = 'completed' | 'current' | 'incomplete' | 'upcoming'

export interface StepperStep {
  id: string
  label: string
  completed?: boolean
}

const props = withDefaults(
  defineProps<{
    steps: readonly StepperStep[]
    currentStepId?: string
    label?: string
    summary?: string
    statusLabels?: Partial<Record<StepperStatus, string>>
  }>(),
  {
    currentStepId: undefined,
    label: 'Progression du parcours',
    summary: undefined,
    statusLabels: undefined,
  },
)

const DEFAULT_STATUS_LABELS: Record<StepperStatus, string> = {
  completed: 'Terminée',
  current: 'Étape en cours',
  incomplete: 'À compléter',
  upcoming: 'À venir',
}

const labels = computed(() => ({ ...DEFAULT_STATUS_LABELS, ...props.statusLabels }))
const currentIndex = computed(() =>
  props.steps.findIndex((step) => step.id === props.currentStepId),
)

const items = computed(() =>
  props.steps.map((step, index) => {
    const status: StepperStatus =
      index === currentIndex.value
        ? 'current'
        : step.completed
          ? 'completed'
          : currentIndex.value >= 0 && index < currentIndex.value
            ? 'incomplete'
            : 'upcoming'
    return { step, index, status, statusLabel: labels.value[status] }
  }),
)

const percent = computed(() =>
  currentIndex.value < 0 || props.steps.length === 0
    ? 0
    : Math.round(((currentIndex.value + 1) / props.steps.length) * 100),
)

const summaryText = computed(() => {
  if (props.summary !== undefined) return props.summary
  const current = props.steps[currentIndex.value]
  return current
    ? `Étape ${currentIndex.value + 1} sur ${props.steps.length} · ${current.label}`
    : `${props.steps.length} étapes`
})
</script>

<template>
  <nav class="base-stepper" :aria-label="label">
    <p class="base-stepper-summary" aria-live="polite">{{ summaryText }}</p>
    <div class="base-stepper-track" aria-hidden="true">
      <div class="base-stepper-fill" :style="{ inlineSize: `${percent}%` }" />
    </div>
    <ol class="sr-only">
      <li
        v-for="item in items"
        :key="`${item.index}-${item.step.id}`"
        :data-status="item.status"
        :aria-current="item.status === 'current' ? 'step' : undefined"
      >
        {{ item.step.label }} : {{ item.statusLabel }}
      </li>
    </ol>
  </nav>
</template>

<style scoped>
@layer components {
  .base-stepper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-xs);
    min-width: 0;
    color: var(--color-epolia-text);
    font-family: var(--font-epolia-body);
  }

  .base-stepper-summary {
    margin: 0;
    color: var(--color-epolia-text-secondary);
    font-size: var(--text-epolia-body-small);
    line-height: var(--text-epolia-body-small--line-height);
    overflow-wrap: anywhere;
  }

  .base-stepper-track {
    block-size: 0.375rem;
    overflow: hidden;
    border-radius: 0.1875rem;
    background: var(--color-epolia-border);
  }

  .base-stepper-fill {
    block-size: 100%;
    border-radius: inherit;
    background: var(--color-epolia-primary);
    transition: inline-size 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .base-stepper-fill {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base-stepper-track {
      border: 1px solid CanvasText;
      background: Canvas;
    }

    .base-stepper-fill {
      background: Highlight;
    }
  }
}
</style>
