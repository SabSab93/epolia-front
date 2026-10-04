import type { Meta, StoryObj } from '@storybook/vue3'
import BaseButton from './BaseButton.vue'

const meta = {
  title: 'Base/BaseButton',
  component: BaseButton,
  args: {
    label: 'Continuer',
  },
} satisfies Meta<typeof BaseButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
