import type { Meta, StoryObj } from '@storybook/vue3'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const meta = {
  title: 'Shared/BaseTitle',
  component: BaseTitle,
  tags: ['autodocs'],
  args: { level: 'h2', default: 'Titre de section' },
  argTypes: {
    level: { control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
  },
  render: (args) => ({
    components: { BaseTitle },
    setup: () => ({ args }),
    template: '<BaseTitle :level="args.level">{{ args.default }}</BaseTitle>',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Un niveau h1, h2, h3 ou h4 définit la balise et sa taille. Choisir le niveau selon la hiérarchie du contenu. Police, graisse et largeur sont automatiques : h1 extra-gras, h2 condensé et gras, h3 semi-gras, h4 medium.',
      },
    },
  },
} satisfies Meta<typeof BaseTitle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Heading1: Story = { args: { level: 'h1', default: 'Titre de page' } }
export const Heading3: Story = { args: { level: 'h3', default: 'Titre de groupe' } }
export const Heading4: Story = { args: { level: 'h4', default: 'Titre de sous-groupe' } }
export const LongTitle: Story = {
  args: { default: 'Un titre suffisamment long pour vérifier le retour à la ligne sur mobile' },
  decorators: [() => ({ template: '<div class="max-w-64"><story /></div>' })],
}

export const Hierarchy: Story = {
  render: () => ({
    components: { BaseTitle },
    template: `<div class="max-w-md space-y-epolia-lg text-epolia-text">
      <div class="space-y-epolia-xs">
        <p class="text-epolia-body-small text-epolia-text-secondary">H1 · 32 px · Extra-gras</p>
        <BaseTitle level="h1">Bricolage Grotesque</BaseTitle>
      </div>
      <div class="space-y-epolia-xs">
        <p class="text-epolia-body-small text-epolia-text-secondary">H2 · 24 px · Gras condensé</p>
        <BaseTitle level="h2">Bricolage Grotesque</BaseTitle>
      </div>
      <div class="space-y-epolia-xs">
        <p class="text-epolia-body-small text-epolia-text-secondary">H3 · 20 px · Semi-gras</p>
        <BaseTitle level="h3">Bricolage Grotesque</BaseTitle>
      </div>
      <div class="space-y-epolia-xs">
        <p class="text-epolia-body-small text-epolia-text-secondary">H4 · 18 px · Medium</p>
        <BaseTitle level="h4">Bricolage Grotesque</BaseTitle>
      </div>
    </div>`,
  }),
}
