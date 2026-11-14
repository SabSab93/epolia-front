import type { Meta, StoryObj } from '@storybook/vue3'
import { computed } from 'vue'
import IconArrowBack from '~icons/material-symbols/arrow-back'
import IconArrowForward from '~icons/material-symbols/arrow-forward'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'

type ButtonStoryArgs = InstanceType<typeof BaseButton>['$props'] & {
  iconPosition: 'none' | 'left' | 'right'
}

const meta = {
  title: 'Shared/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  args: {
    label: 'Continuer',
    variant: 'primary',
    disabled: false,
    loading: false,
    type: 'button',
    iconPosition: 'none',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    iconPosition: {
      name: 'Icône',
      control: 'inline-radio',
      options: ['none', 'left', 'right'],
      labels: { none: 'Aucune', left: 'À gauche', right: 'À droite' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Bouton mobile Epolia : primary rempli, secondary avec contour, tertiary sans contour. Zone tactile minimale de 48 × 48 px CSS. Le chargement bloque les clics et conserve le libellé. Icône facultative par le slot `icon-left` ou `icon-right` (un seul à la fois, non vérifié par le composant), avec `<BaseIcon :icon="…" :size="20" />` sans `label` : le libellé du bouton suffit, l’icône est masquée aux lecteurs d’écran. Pendant le chargement, le spinner prend la place de l’icône (à gauche sans icône). Palette provisoire ; aucune variante de mode sombre.',
      },
    },
  },
  render: (args) => ({
    components: { BaseButton, BaseIcon },
    setup() {
      // Every story arg except iconPosition goes to BaseButton.
      const buttonProps = computed(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { iconPosition, ...props } = args
        return props
      })
      return { args, buttonProps, IconArrowBack, IconArrowForward }
    },
    template: `
      <BaseButton v-bind="buttonProps">
        <template v-if="args.iconPosition === 'left'" #icon-left>
          <BaseIcon :icon="IconArrowBack" :size="20" />
        </template>
        <template v-if="args.iconPosition === 'right'" #icon-right>
          <BaseIcon :icon="IconArrowForward" :size="20" />
        </template>
      </BaseButton>
    `,
  }),
} satisfies Meta<ButtonStoryArgs>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', label: 'Revenir' } }
export const Tertiary: Story = { args: { variant: 'tertiary', label: 'Plus tard' } }
export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { loading: true, label: 'Enregistrement en cours' } }
export const IconLeft: Story = {
  name: 'Icône à gauche',
  args: { variant: 'secondary', label: 'Revenir', iconPosition: 'left' },
}
export const IconRight: Story = { name: 'Icône à droite', args: { iconPosition: 'right' } }
export const IconLongLabel: Story = {
  name: 'Icône et texte long',
  args: {
    label: 'Continuer vers la vérification de mon profil étudiant',
    iconPosition: 'right',
  },
  decorators: [() => ({ template: '<div class="max-w-xs"><story /></div>' })],
}
export const IconDisabled: Story = {
  name: 'Icône désactivée',
  args: { iconPosition: 'right', disabled: true },
}
export const IconLoading: Story = {
  name: 'Icône en chargement',
  args: { iconPosition: 'right', loading: true, label: 'Envoi en cours' },
}
