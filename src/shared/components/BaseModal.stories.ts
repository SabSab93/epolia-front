import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseModal from '@/shared/components/BaseModal.vue'

type ModalStoryArgs = Omit<InstanceType<typeof BaseModal>['$props'], 'open'>

const meta = {
  title: 'Shared/BaseModal',
  component: BaseModal,
  tags: ['autodocs'],
  args: {
    title: 'Me mettre en pause',
    description: 'Votre profil n’apparaîtra plus dans les recherches jusqu’à la date choisie.',
    confirmation: false,
    cancelLabel: 'Annuler',
  },
  argTypes: {
    title: { name: 'Titre', control: 'text' },
    description: { name: 'Description', control: 'text' },
    confirmation: { name: 'Confirmation', control: 'boolean' },
    cancelLabel: { name: 'Libellé d’annulation', control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Panneau qui monte du bas de l’écran (Reka Dialog). Ouverture par `v-model:open` : le parent garde le bouton qui l’ouvre et l’action métier. Slots : contenu par défaut, `actions` pour les boutons (pleine largeur, 8 px entre eux). `cancelLabel` ajoute un bouton tertiaire qui ferme. Dialogue : focus sur le titre à l’ouverture, fermeture par ×, Échap, appui sur le fond ou glissement de la poignée vers le bas. Confirmation (`confirmation`) : lu comme « alertdialog », pas de × ni de poignée, le fond ne ferme pas, Échap = Annuler, focus sur Annuler. Le focus reste dans la modale puis revient au bouton d’ouverture. Le contenu long défile, le titre et les actions restent visibles. Glissement, clavier virtuel et lecteurs d’écran à vérifier sur Android/iOS.',
      },
    },
  },
  render: (args) => ({
    components: { BaseButton, BaseModal },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
      <BaseButton label="Ouvrir la modale" @click="open = true" />
      <BaseModal v-model:open="open" v-bind="args">
        <p>Vos conversations et missions en cours sont conservées.</p>
        <template #actions>
          <BaseButton label="Mettre en pause" @click="open = false" />
        </template>
      </BaseModal>
    `,
  }),
} satisfies Meta<ModalStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Dialog: Story = { name: 'Dialogue' }

export const LongContent = {
  name: 'Contenu long',
  args: { title: 'Conditions de la pause', description: undefined, cancelLabel: undefined },
  render: (args) => ({
    components: { BaseButton, BaseModal },
    setup() {
      const open = ref(false)
      const paragraphs = Array.from(
        { length: 12 },
        (_, index) =>
          `Point ${index + 1} : pendant la pause, votre profil reste enregistré et vous pouvez revenir à tout moment.`,
      )
      return { args, open, paragraphs }
    },
    template: `
      <BaseButton label="Ouvrir la modale" @click="open = true" />
      <BaseModal v-model:open="open" v-bind="args">
        <div class="flex flex-col gap-epolia-sm">
          <p v-for="paragraph in paragraphs" :key="paragraph">{{ paragraph }}</p>
        </div>
        <template #actions>
          <BaseButton label="J’ai compris" @click="open = false" />
        </template>
      </BaseModal>
    `,
  }),
} satisfies Story

export const WithForm = {
  name: 'Avec un champ',
  args: {
    title: 'Signaler un problème',
    description: 'Décrivez ce qui s’est passé.',
    cancelLabel: 'Annuler',
  },
  render: (args) => ({
    components: { BaseButton, BaseInput, BaseModal },
    setup() {
      const open = ref(false)
      const message = ref('')
      return { args, open, message }
    },
    template: `
      <BaseButton label="Ouvrir la modale" @click="open = true" />
      <BaseModal v-model:open="open" v-bind="args">
        <form id="report-form" @submit.prevent="open = false">
          <BaseInput v-model="message" label="Votre message" type="textarea" />
        </form>
        <template #actions>
          <BaseButton type="submit" form="report-form" label="Envoyer" />
        </template>
      </BaseModal>
    `,
  }),
} satisfies Story

export const Confirmation = {
  name: 'Confirmation',
  args: {
    title: 'Supprimer ce document ?',
    description: 'Le document sera retiré de votre profil. Cette action est définitive.',
    confirmation: true,
    cancelLabel: undefined,
  },
  render: (args) => ({
    components: { BaseButton, BaseModal },
    setup() {
      const open = ref(false)
      const result = ref('')
      function confirm() {
        // The consumer owns the destructive action.
        result.value = 'Document supprimé.'
        open.value = false
      }
      return { args, open, result, confirm }
    },
    template: `
      <div class="flex flex-col items-start gap-epolia-md">
        <BaseButton label="Supprimer le document" variant="secondary" @click="open = true" />
        <p role="status" class="text-epolia-body">{{ result }}</p>
      </div>
      <BaseModal v-model:open="open" v-bind="args">
        <template #actions>
          <BaseButton label="Supprimer" @click="confirm" />
        </template>
      </BaseModal>
    `,
  }),
} satisfies Story
