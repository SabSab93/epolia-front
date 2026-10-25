import type { Meta, StoryObj } from '@storybook/vue3'
import BaseButton from '@/shared/components/BaseButton.vue'

const meta = {
  title: 'Shared/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  args: {
    label: 'Continuer',
    variant: 'default',
    disabled: false,
    loading: false,
    type: 'button',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'tertiary'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Bouton mobile Epolia : default rempli, secondary avec contour, tertiary sans contour. Zone tactile minimale de 48 × 48 px CSS. Le chargement bloque les clics et conserve le libellé. Palette provisoire ; aucune variante de mode sombre.',
      },
    },
  },
} satisfies Meta<typeof BaseButton>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', label: 'Revenir' } }
export const Tertiary: Story = { args: { variant: 'tertiary', label: 'Plus tard' } }
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { loading: true, label: 'Enregistrement en cours' } }
