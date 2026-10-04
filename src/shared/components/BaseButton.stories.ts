import type { Meta, StoryObj } from '@storybook/vue3'
import BaseButton from '@/shared/components/BaseButton.vue'

const meta = {
  title: 'Shared/BaseButton',
  component: BaseButton,
  args: {
    label: 'Continuer',
  },
} satisfies Meta<typeof BaseButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
