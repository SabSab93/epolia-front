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

// One modal whose action uses a status variant of BaseButton (danger, warning or info).
function statusRender(
  opener: string,
  action: string,
  variant: 'danger' | 'warning' | 'info',
  result: string,
) {
  return (args: ModalStoryArgs) => ({
    components: { BaseButton, BaseModal },
    setup() {
      const open = ref(false)
      const message = ref('')
      function confirm() {
        // The consumer owns the action.
        message.value = result
        open.value = false
      }
      return { args, open, message, confirm, opener, action, variant }
    },
    template: `
      <div class="flex flex-col items-start gap-epolia-md">
        <BaseButton :label="opener" variant="secondary" @click="open = true" />
        <p role="status" class="text-epolia-body">{{ message }}</p>
      </div>
      <BaseModal v-model:open="open" v-bind="args">
        <template #actions>
          <BaseButton :label="action" :variant="variant" @click="confirm" />
        </template>
      </BaseModal>
    `,
  })
}

export const Confirmation = {
  name: 'Confirmation (danger)',
  args: {
    title: 'Supprimer ce document ?',
    description: 'Le document sera retiré de votre profil. Cette action est définitive.',
    confirmation: true,
    cancelLabel: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Action destructrice : bouton `danger`. Si le bouton qui a ouvert la modale disparaît pendant l’action (par exemple la ligne supprimée), le focus ne peut pas y revenir et repart en haut de la page : c’est à l’écran parent de le déplacer après la fermeture, vers le titre de la liste ou l’élément suivant.',
      },
    },
  },
  render: statusRender('Supprimer le document', 'Supprimer', 'danger', 'Document supprimé.'),
} satisfies Story

export const WarningConfirmation = {
  name: 'Confirmation (warning)',
  args: {
    title: 'Annuler cette mission ?',
    description: 'L’étudiant sera prévenu de l’annulation.',
    confirmation: true,
    cancelLabel: 'Garder la mission',
  },
  parameters: {
    docs: { description: { story: 'Action à risque mais pas destructrice : bouton `warning`.' } },
  },
  render: statusRender('Annuler la mission', 'Annuler la mission', 'warning', 'Mission annulée.'),
} satisfies Story

export const InfoDialog = {
  name: 'Dialogue (info)',
  args: {
    title: 'Votre profil est en relecture',
    description: 'Il sera visible dès que votre justificatif étudiant aura été vérifié.',
    confirmation: false,
    cancelLabel: 'Plus tard',
  },
  parameters: {
    docs: { description: { story: 'Action d’information : bouton `info`.' } },
  },
  render: statusRender('Voir mon profil', 'Voir les étapes', 'info', 'Étapes affichées.'),
} satisfies Story
