import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseHeader from '@/shared/components/BaseHeader.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type HeaderStoryArgs = {
  title: string
  level: 'h1' | 'h2' | 'h3' | 'h4'
  showBack: boolean
  backLabel: string
  showActions: boolean
  actionLabel: string
  actionDisabled: boolean
  actionLoading: boolean
}

const meta = {
  title: 'Shared/BaseHeader',
  component: BaseHeader,
  tags: ['autodocs'],
  args: {
    title: 'Vos préférences',
    level: 'h1',
    showBack: false,
    backLabel: 'Retour',
    showActions: true,
    actionLabel: 'Enregistrer',
    actionDisabled: false,
    actionLoading: false,
  },
  argTypes: {
    title: { name: 'Titre', control: 'text' },
    level: { name: 'Niveau du titre', control: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
    showBack: { name: 'Afficher le retour', control: 'boolean' },
    backLabel: { name: 'Libellé du retour', control: 'text', if: { arg: 'showBack' } },
    showActions: { name: 'Afficher les actions', control: 'boolean' },
    actionLabel: { name: 'Libellé de l’action', control: 'text', if: { arg: 'showActions' } },
    actionDisabled: { name: 'Action désactivée', control: 'boolean', if: { arg: 'showActions' } },
    actionLoading: { name: 'Action en cours', control: 'boolean', if: { arg: 'showActions' } },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-5xl p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'En-tête de contenu : `title` obligatoire, `level` h1–h4 (h1 par défaut), `showBack` et `backLabel` (« Retour »). Émet `back` sans naviguer ; le consommateur gère destination, focus après navigation et titre du document. Slot `actions` libre, sans v-model. Exemple dans un `<main>` : `<BaseHeader title="Préférences" show-back @back="revenir"><template #actions><BaseButton label="Enregistrer" /></template></BaseHeader>`. Le layout porte les marges, la largeur et les zones sûres ; pas de position fixe. Un titre n’est pas réduit par son niveau pour tenir sur une ligne. Retour textuel en attendant BaseIcon #15. Les actions des stories sont simulées ; les essais navigateur ne couvrent pas les appareils Android/iOS ni VoiceOver/TalkBack.',
      },
    },
  },
  render: (args) => ({
    components: { BaseHeader, BaseButton },
    setup() {
      const feedback = ref('')
      function simulate(label: string) {
        feedback.value = `Action « ${label} » déclenchée pour la démonstration.`
      }
      return { args, feedback, simulate }
    },
    template: `
      <main class="flex min-w-0 flex-col gap-epolia-lg">
        <BaseHeader
          :title="args.title"
          :level="args.level"
          :show-back="args.showBack"
          :back-label="args.backLabel"
          @back="simulate(args.backLabel)"
        >
          <template v-if="args.showActions" #actions>
            <BaseButton
              :label="args.actionLabel"
              :disabled="args.actionDisabled"
              :loading="args.actionLoading"
              @click="simulate(args.actionLabel)"
            />
          </template>
        </BaseHeader>
        <p>Le contenu de la page suit l’en-tête et reste aligné avec son titre.</p>
        <p role="status" class="text-epolia-body-small text-epolia-text-secondary">{{ feedback }}</p>
      </main>
    `,
  }),
} satisfies Meta<HeaderStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LongTitle: Story = {
  name: 'Titre long',
  args: {
    title: 'Toutes les informations utiles pour préparer votre prochaine collaboration',
    showBack: true,
    backLabel: 'Retour aux préférences du profil',
    actionLabel: 'Enregistrer toutes les modifications',
  },
}
