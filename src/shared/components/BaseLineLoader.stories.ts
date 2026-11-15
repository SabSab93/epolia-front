import type { Meta, StoryObj } from '@storybook/vue3'
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
