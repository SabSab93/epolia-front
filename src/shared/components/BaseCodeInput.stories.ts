import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseCodeInput from '@/shared/components/BaseCodeInput.vue'

export type CodeInputStoryArgs = InstanceType<typeof BaseCodeInput>['$props']

const meta = {
  title: 'Shared/BaseCodeInput',
  component: BaseCodeInput,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: 'Code de vérification',
    help: 'Le code est valable 10 minutes.',
    error: undefined,
    disabled: false,
  },
  argTypes: {
    modelValue: { control: 'text' },
    label: { control: 'text' },
    help: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-md p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Code à 6 chiffres : `<BaseCodeInput v-model="code" label="Code de vérification" />`. Un seul vrai champ couvre les six cases : saisie, collage et remplissage automatique (`autocomplete="one-time-code"`) fonctionnent, et les lecteurs d’écran lisent un champ normal. Seuls les chiffres sont gardés (6 au maximum). label est obligatoire ; id/name/help/error/disabled sont optionnels ; `focus()` est exposé pour revenir au champ après une erreur. Le parent gère l’envoi, les messages métier et le renvoi du code. Les essais Storybook web ne remplacent pas TalkBack/VoiceOver ni le remplissage automatique réel sur Android/iOS.',
      },
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs<CodeInputStoryArgs>()
    return {
      components: { BaseCodeInput },
      setup() {
        function updateValue(modelValue: string) {
          updateArgs({ modelValue })
        }
        return { args, updateValue }
      },
      template: '<BaseCodeInput v-bind="args" @update:model-value="updateValue" />',
    }
  },
} satisfies Meta<CodeInputStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { name: 'Vide' }
export const Typing: Story = { name: 'En cours de saisie', args: { modelValue: '482' } }
export const WrongCode: Story = {
  name: 'Code incorrect',
  args: {
    modelValue: '482917',
    help: undefined,
    error:
      'Code incorrect. Vérifiez les chiffres saisis ou demandez un nouveau code. Il vous reste 4 essais.',
  },
}
export const Disabled: Story = {
  name: 'Désactivé (code expiré)',
  args: { disabled: true, help: undefined },
}
export const LongLabel: Story = {
  name: 'Texte long',
  args: {
    label: 'Code de vérification reçu par e-mail pour confirmer votre adresse',
    help: 'Le code est valable 10 minutes. Pensez à regarder dans vos courriers indésirables.',
  },
}
