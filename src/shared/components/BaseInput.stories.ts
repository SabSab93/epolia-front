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
    ariaLabel: 'Nom',
    type: 'text',
    rows: 4,
    clearable: true,
    required: false,
    disabled: false,
    readonly: false,
    showLabel: true,
    showHelp: false,
    showError: true,
    help: 'Indiquez votre nom.',
    error: 'Vérifiez votre saisie.',
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'textarea'] },
    showLabel: { name: 'Afficher le label', control: 'boolean' },
    showHelp: { name: 'Afficher l’aide', control: 'boolean' },
    showError: { name: 'Afficher l’erreur', control: 'boolean' },
    label: { name: 'Texte du label', control: 'text' },
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
          'Les contrôles permettent d’afficher le label, l’aide et l’erreur et de modifier leur texte. Sans label visible, renseigner ariaLabel. Le textarea utilise 4 lignes par défaut.',
      },
    },
  },
} satisfies Meta<InputStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Text: Story = { name: 'Texte', args: { modelValue: 'Sabrina' } }
export const Textarea: Story = {
  name: 'Area',
  args: {
    type: 'textarea',
    label: 'Message',
    ariaLabel: 'Message',
    modelValue: 'Bonjour,\nVoici ma demande.',
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
    help: 'Exemple : nom@exemple.fr',
    error: 'Saisissez une adresse email complète.',
  },
}
