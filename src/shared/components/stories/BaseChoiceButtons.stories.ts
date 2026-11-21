import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseChoiceButtons from '@/shared/components/BaseChoiceButtons.vue'

const meta = {
  title: 'Shared/BaseChoiceButtons',
  component: BaseChoiceButtons,
  tags: ['autodocs'],
  args: {
    legend: 'Période à afficher',
    options: [
      { value: 'day', label: 'Jour' },
      { value: 'week', label: 'Semaine' },
      { value: 'month', label: 'Mois' },
    ],
    modelValue: 'week',
  },
  render: (args) => {
    const [, updateArgs] = useArgs()
    return {
      components: { BaseChoiceButtons },
      setup: () => ({ args, select: (modelValue: string) => updateArgs({ modelValue }) }),
      template: '<BaseChoiceButtons v-bind="args" @update:model-value="select" />',
    }
  },
} satisfies Meta<typeof BaseChoiceButtons>

export default meta
export const Default: StoryObj<typeof meta> = {}
