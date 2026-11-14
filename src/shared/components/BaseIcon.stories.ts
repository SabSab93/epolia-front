import type { Meta, StoryObj } from '@storybook/vue3'
import { markRaw } from 'vue'
import IconFavoriteOutline from '~icons/material-symbols/favorite-outline'
import IconInfoOutline from '~icons/material-symbols/info-outline'
import IconSearch from '~icons/material-symbols/search'
import IconVerified from '~icons/material-symbols/verified'
import BaseIcon from '@/shared/components/BaseIcon.vue'

// Only these icons are bundled in Storybook: each one is imported explicitly.
// markRaw keeps Vue from making the icon components reactive inside story args.
const storyIcons = {
  search: markRaw(IconSearch),
  favorite_outline: markRaw(IconFavoriteOutline),
  info_outline: markRaw(IconInfoOutline),
  verified: markRaw(IconVerified),
}

const meta = {
  title: 'Shared/BaseIcon',
  component: BaseIcon,
  tags: ['autodocs'],
  args: { icon: storyIcons.search, size: 24, label: '' },
  argTypes: {
    icon: {
      name: 'Icône',
      control: 'select',
      options: Object.keys(storyIcons),
      mapping: storyIcons,
    },
    size: { name: 'Taille (px)', control: 'inline-radio', options: [20, 24] },
    label: { name: 'Alternative textuelle', control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Icône Material Symbols (celles du Figma), importée une par une : `import IconSearch from '~icons/material-symbols/search'`. Contour = suffixe `-outline` quand il existe, Plein = nom seul. Tailles : 20 px dans un bouton, 24 px pour la navigation, en rem pour suivre le zoom du texte. Couleur = celle du texte parent (currentColor). Sans `label`, l’icône est décorative et masquée aux lecteurs d’écran ; avec `label`, elle devient une image nommée. Jamais focusable : la zone tactile reste celle du contrôle parent (48 × 48 px CSS minimum).",
      },
    },
  },
} satisfies Meta<typeof BaseIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Decorative: Story = { name: 'Décorative' }

export const Informative = {
  name: 'Informative',
  args: { icon: storyIcons.verified, label: 'Profil vérifié' },
  render: (args) => ({
    components: { BaseIcon },
    setup: () => ({ args }),
    template: `
      <p class="flex items-center gap-epolia-xs text-epolia-body text-epolia-text">
        Camille Martin
        <BaseIcon v-bind="args" class="text-epolia-primary" />
      </p>
    `,
  }),
} satisfies Story

export const InheritedColor = {
  name: 'Couleur héritée',
  args: { icon: storyIcons.info_outline, size: 20 },
  render: (args) => ({
    components: { BaseIcon },
    setup: () => ({ args }),
    template: `
      <p class="flex items-center gap-epolia-xs text-epolia-body-small text-epolia-text-secondary">
        <BaseIcon v-bind="args" />
        Vous pourrez modifier ces informations plus tard.
      </p>
    `,
  }),
} satisfies Story
