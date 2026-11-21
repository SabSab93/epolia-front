import type { Meta, StoryObj } from '@storybook/vue3'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import avatarDemo from '@/assets/images/avatar-camille-demo.webp'

const meta = {
  title: 'Shared/BaseAvatar',
  component: BaseAvatar,
  tags: ['autodocs'],
  args: { src: avatarDemo, alt: 'Camille D.', initials: 'CD', size: 'md', shape: 'circle' },
  argTypes: {
    src: { name: 'Image (vide : sans photo)', control: 'text' },
    alt: { name: 'Alternative (vide : décoratif)', control: 'text' },
    initials: { name: 'Initiales publiques', control: 'text' },
    badgeLabel: { name: 'Libellé accessible du badge', control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'rounded'] },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-sm p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Avatar non interactif. Les initiales sont affichées si la photo manque, charge ou échoue. Renseigner alt pour un portrait seul et le laisser vide si le nom est déjà visible. Le slot badge accepte une icône SVG remplaçable. Renseigner badgeLabel lorsque le badge apporte une information absente du texte voisin.',
      },
    },
  },
  render: (args) => ({
    components: { BaseAvatar },
    setup: () => ({ args }),
    template: '<BaseAvatar v-bind="args" />',
  }),
} satisfies Meta<typeof BaseAvatar>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: 'Image' }
export const Fallback: Story = { name: 'Sans photo', args: { src: '' } }

export const Identity: Story = {
  name: 'Identité',
  args: { alt: '' },
  render: (args) => ({
    components: { BaseAvatar },
    setup: () => ({ args }),
    template: `<div class="flex w-fit max-w-full flex-col items-center text-center text-epolia-body-small">
      <BaseAvatar v-bind="args" />
      <div class="mt-epolia-xs min-w-0 max-w-full wrap-break-word">
        <p class="font-semibold text-epolia-text">Camille D.</p>
        <p class="text-epolia-text-secondary">BTS Communication</p>
      </div>
    </div>`,
  }),
}

export const WithBadge: Story = {
  name: 'Image avec badge',
  args: { badgeLabel: 'Statut étudiant vérifié' },
  render: (args) => ({
    components: { BaseAvatar },
    setup: () => ({ args }),
    template: `<BaseAvatar v-bind="args">
      <template #badge>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <path d="m3 8 3 3 7-7" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </template>
    </BaseAvatar>`,
  }),
}
