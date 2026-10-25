import { computed, ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseInput from '@/shared/components/BaseInput.vue'

type InputStoryArgs = InstanceType<typeof BaseInput>['$props'] & {
  showLabel: boolean
  showHelp: boolean
  showError: boolean
}

const meta = {
  title: 'Shared/BaseInput',
  component: BaseInput,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: 'Nom',
    placeholder: 'Indiquez votre nom',
    ariaLabel: 'Nom',
    type: 'text',
    rows: 4,
    clearable: true,
    required: false,
    disabled: false,
    readonly: false,
    showLabel: true,
    showHelp: false,
    showError: false,
    help: 'Indiquez votre nom.',
    error: 'Vérifiez votre saisie.',
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'date', 'textarea'] },
    showLabel: { name: 'Afficher le label', control: 'boolean' },
    showHelp: { name: 'Afficher l’aide', control: 'boolean' },
    showError: { name: 'Afficher l’erreur', control: 'boolean' },
    label: { name: 'Texte du label', control: 'text' },
    placeholder: { name: 'Placeholder', control: 'text', if: { arg: 'type', neq: 'date' } },
    help: { name: 'Texte de l’aide', control: 'text', if: { arg: 'showHelp' } },
    error: { name: 'Texte de l’erreur', control: 'text', if: { arg: 'showError' } },
    ariaLabel: { control: 'text', if: { arg: 'showLabel', truthy: false } },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    clearable: { control: 'boolean' },
    rows: { control: { type: 'number', min: 1 }, if: { arg: 'type', eq: 'textarea' } },
    inputmode: {
      control: 'select',
      options: ['text', 'email', 'search', 'tel', 'url', 'numeric', 'decimal', 'none'],
    },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-md p-epolia-md"><story /></div>' })],
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
      const fieldProps = computed(() => {
        const { showLabel, showHelp, showError, ...props } = args
        return {
          ...props,
          label: showLabel ? props.label : undefined,
          ariaLabel: showLabel ? undefined : props.ariaLabel,
          help: showHelp ? props.help : undefined,
          error: showError ? props.error : undefined,
        }
      })
      return { fieldProps, value }
    },
    template: '<BaseInput v-bind="fieldProps" v-model="value" />',
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Les contrôles permettent d’afficher le label, l’aide et l’erreur et de modifier leur texte. Le placeholder donne un exemple dans le champ vide et ne remplace pas le label. L’aide sous le champ reste optionnelle. Le type date utilise les repères de format du navigateur, sans placeholder personnalisé. Sans label visible, renseigner ariaLabel. Le textarea utilise 4 lignes par défaut.',
      },
    },
  },
} satisfies Meta<InputStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Text: Story = { name: 'Texte' }
export const Textarea: Story = {
  name: 'Area',
  args: {
    type: 'textarea',
    label: 'Message',
    ariaLabel: 'Message',
    placeholder: 'Écrivez votre message',
    help: 'Vous pouvez écrire sur plusieurs lignes.',
    error: 'Précisez votre demande.',
  },
}
export const Email: Story = {
  args: {
    label: 'Adresse email',
    ariaLabel: 'Adresse email',
    type: 'email',
    name: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    placeholder: 'nom@exemple.fr',
    help: 'Exemple : nom@exemple.fr',
    error: 'Saisissez une adresse email complète.',
  },
}

export const Date: Story = {
  args: {
    label: 'Date de naissance',
    ariaLabel: 'Date de naissance',
    type: 'date',
    placeholder: undefined,
    name: 'birthDate',
    autocomplete: 'bday',
    required: true,
    help: 'Renseignez votre date de naissance.',
    error: 'Vérifiez votre date de naissance.',
    showHelp: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Le sélecteur et le format affiché dépendent du navigateur et du système. v-model contient une chaîne YYYY-MM-DD ou une chaîne vide, sans conversion de fuseau. Les attributs natifs min et max sont transmis au champ : `<BaseInput v-model="birthDate" type="date" label="Date de naissance" autocomplete="bday" max="2026-10-25" />` (borne illustrative fournie par le formulaire). La règle de majorité reste dans le formulaire et côté serveur. Vérifier le sélecteur dans les WebViews Android/iOS ; Storybook sur ordinateur ne reproduit pas leur comportement.',
      },
    },
  },
}

export const DateError: Story = {
  name: 'Date en erreur',
  args: { ...Date.args, modelValue: '1996-02-29', showError: true },
}
