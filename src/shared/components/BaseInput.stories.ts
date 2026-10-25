import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const meta = {
  title: 'Shared/BaseInput',
  component: BaseInput,
  tags: ['autodocs'],
  args: { modelValue: '', label: 'Nom', type: 'text', clearable: true },
  argTypes: {
    type: { control: 'select', options: ['text', 'email'] },
    inputmode: {
      control: 'select',
      options: ['text', 'email', 'search', 'tel', 'url', 'numeric', 'decimal', 'none'],
    },
  },
  decorators: [
    () => ({ template: '<div class="mx-auto w-full max-w-md p-epolia-md"><story /></div>' }),
  ],
  render: (args) => ({
    components: { BaseInput },
    setup() {
      const value = ref(args.modelValue)
      watch(
        () => args.modelValue,
        (next) => {
          value.value = next
        },
      )
      return { args, value }
    },
    template: '<BaseInput v-bind="args" v-model="value" />',
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Champ texte/email avec v-model (string), label visible recommandé, aide et erreur associées. Sans label visible, fournir ariaLabel. required ajoute une étoile au label ; expliquer « * Champ obligatoire » au niveau du formulaire. clearable est activé par défaut : la croix efface puis rend le focus au champ. Aucune validation métier ni bibliothèque d’icônes. Styles partagés avec l’application ; rendu natif Android/iOS à vérifier.',
      },
    },
  },
} satisfies Meta<typeof BaseInput>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = {}
export const Email: Story = {
  args: {
    label: 'Adresse email',
    type: 'email',
    name: 'email',
    autocomplete: 'email',
    inputmode: 'email',
  },
}
export const WithHelp: Story = {
  args: { help: 'Utilisez le nom que vous souhaitez afficher sur votre profil.' },
}
export const WithError: Story = {
  args: {
    modelValue: 'adresse-incomplète',
    label: 'Adresse email',
    type: 'email',
    help: 'Exemple : nom@exemple.fr',
    error: 'Saisissez une adresse email complète.',
  },
}
export const Required: Story = { args: { required: true, help: '* Champ obligatoire.' } }
export const Disabled: Story = { args: { modelValue: 'Valeur conservée', disabled: true } }
export const Readonly: Story = { args: { modelValue: 'Valeur en lecture seule', readonly: true } }
export const Filled: Story = { args: { modelValue: 'Sabrina' } }
export const WithoutClear: Story = { args: { modelValue: 'Sabrina', clearable: false } }
export const WithoutVisibleLabel: Story = {
  args: {
    label: undefined,
    ariaLabel: 'Rechercher une prestation',
    help: 'Rechercher une prestation par son nom.',
  },
}
export const LongLabel: Story = {
  args: {
    label: 'Nom complet de la personne à contacter pour organiser votre prochaine prestation',
    help: 'Ce texte long doit rester lisible sur un écran étroit et avec une taille de texte agrandie.',
  },
}

export const Form: Story = {
  render: () => ({
    components: { BaseInput, BaseButton, BaseTitle },
    setup() {
      const email = ref('')
      const submitted = ref(false)
      function submit() {
        submitted.value = true
      }
      function reset() {
        email.value = ''
        submitted.value = false
      }
      return { email, submitted, submit, reset }
    },
    template: `<form class="flex flex-col gap-epolia-lg" @submit.prevent="submit">
      <BaseTitle>Exemple de formulaire</BaseTitle>
      <p class="text-epolia-body-small text-epolia-text-secondary">* Champ obligatoire.</p>
      <BaseInput v-model="email" label="Adresse email" name="email" type="email" autocomplete="email" inputmode="email" required help="Exemple : nom@exemple.fr" />
      <div class="flex flex-wrap justify-end gap-epolia-xs">
        <BaseButton label="Réinitialiser" variant="secondary" @click="reset" />
        <BaseButton type="submit" label="Continuer" />
      </div>
      <p role="status" class="text-epolia-body text-epolia-text">{{ submitted ? 'Formulaire envoyé (démonstration sans appel API).' : '' }}</p>
    </form>`,
  }),
}
