import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseCard from '@/shared/components/BaseCard.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type CardStoryArgs = {
  heading: string
  headingLevel: 'h1' | 'h2' | 'h3' | 'h4'
  content: string
  showHeader: boolean
  showActions: boolean
  primaryLabel: string
  secondaryLabel: string
}

const meta = {
  title: 'Shared/BaseCard',
  component: BaseCard,
  tags: ['autodocs'],
  args: {
    heading: 'Vos préférences',
    headingLevel: 'h2',
    content: 'Retrouvez ici les informations utiles pour faire votre choix.',
    showHeader: true,
    showActions: false,
    primaryLabel: 'Confirmer',
    secondaryLabel: 'Annuler',
  },
  argTypes: {
    heading: { name: 'Titre', control: 'text', if: { arg: 'showHeader' } },
    headingLevel: {
      name: 'Niveau du titre',
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4'],
      if: { arg: 'showHeader' },
    },
    content: { name: 'Contenu', control: 'text' },
    showHeader: { name: 'Afficher l’en-tête', control: 'boolean' },
    showActions: { name: 'Afficher les actions', control: 'boolean' },
    primaryLabel: { name: 'Action principale', control: 'text', if: { arg: 'showActions' } },
    secondaryLabel: { name: 'Action secondaire', control: 'text', if: { arg: 'showActions' } },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-xl p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Conteneur neutre, sans prop, événement dédié ni v-model. Slots facultatifs : `header`, défaut et `actions`. Exemple : `<BaseCard><template #header><BaseTitle level="h2">Préférences</BaseTitle></template><p>Votre contenu</p><template #actions><BaseButton label="Confirmer" /></template></BaseCard>`. Le consommateur choisit les titres, les actions et la sémantique de page ; seules les actions sont interactives. Une navigation utilise un lien, un choix exclusif BaseRadioGroup. Les attributs/classes natifs vont au div racine ; le parent gère largeur, marges et disposition entre cartes. Les boutons des stories ne font que simuler leurs actions. Essais navigateur distincts de VoiceOver/TalkBack et des appareils Android/iOS/iPadOS.',
      },
    },
  },
  render: (args) => ({
    components: { BaseCard, BaseTitle, BaseButton },
    setup() {
      const feedback = ref('')
      function simulate(label: string) {
        feedback.value = `Action « ${label} » déclenchée pour la démonstration.`
      }
      return { args, feedback, simulate }
    },
    template: `
      <div class="flex min-w-0 flex-col gap-epolia-md">
        <BaseCard>
          <template v-if="args.showHeader" #header>
            <BaseTitle :level="args.headingLevel">{{ args.heading }}</BaseTitle>
          </template>
          <p class="whitespace-pre-line">{{ args.content }}</p>
          <template v-if="args.showActions" #actions>
            <BaseButton :label="args.primaryLabel" @click="simulate(args.primaryLabel)" />
            <BaseButton :label="args.secondaryLabel" variant="secondary" @click="simulate(args.secondaryLabel)" />
          </template>
        </BaseCard>
        <p role="status" class="text-epolia-body-small text-epolia-text-secondary">{{ feedback }}</p>
      </div>
    `,
  }),
} satisfies Meta<CardStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LongContent: Story = {
  name: 'Contenu long',
  args: {
    heading: 'Des informations détaillées qui restent lisibles sur les petits écrans',
    content:
      'Cette carte présente un contenu plus long pour vérifier les retours à la ligne et la place des actions, sans limiter la hauteur du bloc.\nLes informations restent accessibles lorsque le texte est agrandi ; les actions passent à la ligne si la largeur disponible ne suffit plus.\nRéférence de démonstration : InformationsComplémentairesSansEspacePourVérifierLaLisibilitéSurPetitÉcran.',
    showActions: true,
    primaryLabel: 'Confirmer ces préférences détaillées',
    secondaryLabel: 'Annuler les modifications',
  },
}
