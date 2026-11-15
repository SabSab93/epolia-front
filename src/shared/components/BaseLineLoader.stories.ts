import type { Meta, StoryObj } from '@storybook/vue3'
import BaseCard from '@/shared/components/BaseCard.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import BaseLineLoader from '@/shared/components/BaseLineLoader.vue'

const meta = {
  title: 'Shared/BaseLineLoader',
  component: BaseLineLoader,
  tags: ['autodocs'],
  args: { width: 'md', height: 'normal' },
  argTypes: {
    width: { name: 'Largeur', control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    height: { name: 'Hauteur', control: 'select', options: ['thin', 'normal', 'thick'] },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-md p-epolia-md"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component: [
          'Ligne décorative de chargement. Le reflet s’arrête après deux passages et reste désactivé lorsque l’utilisateur réduit les animations. Le composant parent affiche les lignes pendant le chargement et gère une seule annonce pour toute la zone.',
          'Exemple de composition :',
          '```vue\n<div class="flex flex-col gap-epolia-xs">\n  <BaseLineLoader width="sm" height="thick" />\n  <BaseLineLoader width="lg" />\n  <BaseLineLoader width="xs" height="thin" />\n</div>\n```',
        ].join('\n\n'),
      },
    },
  },
} satisfies Meta<typeof BaseLineLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Heights: Story = {
  name: 'Comparaison des hauteurs',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { BaseCard, BaseLineLoader, BaseTitle },
    template: `
      <div class="flex flex-col gap-epolia-md">
        <div class="grid gap-epolia-xs">
          <p class="text-epolia-body-small">Fine · 8 px · Information secondaire</p>
          <BaseLineLoader width="lg" height="thin" />
        </div>
        <div class="grid gap-epolia-xs">
          <p class="text-epolia-body-small">Normale · 12 px · Description</p>
          <BaseLineLoader width="lg" height="normal" />
        </div>
        <div class="grid gap-epolia-xs">
          <p class="text-epolia-body-small">Épaisse · 16 px · Titre de carte</p>
          <BaseLineLoader width="lg" height="thick" />
        </div>
        <div class="grid gap-epolia-xs">
          <p class="text-epolia-body-small">Carte en chargement</p>
          <BaseCard>
            <template #header>
              <div class="grid h-lh items-center text-epolia-title-sm leading-tight">
                <BaseLineLoader width="sm" height="thick" />
              </div>
            </template>
            <div class="grid h-lh items-center text-epolia-body">
              <BaseLineLoader width="lg" />
            </div>
            <div class="grid h-lh items-center text-epolia-body-small">
              <BaseLineLoader width="xs" height="thin" />
            </div>
          </BaseCard>
        </div>
        <div class="grid gap-epolia-xs">
          <p class="text-epolia-body-small">Carte chargée</p>
          <BaseCard>
            <template #header>
              <BaseTitle level="h3">Cours de maths</BaseTitle>
            </template>
            <p class="text-epolia-body">Soutien au lycée.</p>
            <p class="text-epolia-body-small">Grenoble</p>
          </BaseCard>
        </div>
      </div>
    `,
  }),
}
