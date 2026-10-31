import { computed } from 'vue'
import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseRadioGroup from '@/shared/components/BaseRadioGroup.vue'

export type RadioStoryArgs = InstanceType<typeof BaseRadioGroup>['$props'] & {
  showHelp: boolean
  showError: boolean
}

const meta = {
  title: 'Shared/BaseRadioGroup',
  component: BaseRadioGroup,
  tags: ['autodocs'],
  args: {
    modelValue: undefined,
    legend: 'Comment souhaitez-vous être contacté ? ',
    options: [
      { value: 'email', label: 'Par e-mail' },
      { value: 'phone', label: 'Par téléphone' },
      { value: 'post', label: 'Par courrier', disabled: true, description: 'Bientôt disponible.' },
    ],
    required: false,
    disabled: false,
    showHelp: false,
    showError: false,
    help: 'Vous pourrez modifier ce choix à tout moment.',
    error: 'Choisissez un mode de contact.',
  },
  argTypes: {
    modelValue: { control: 'text' },
    options: { control: 'object' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showHelp: { name: 'Afficher l’aide', control: 'boolean' },
    showError: { name: 'Afficher l’erreur', control: 'boolean' },
    help: { control: 'text', if: { arg: 'showHelp' } },
    error: { control: 'text', if: { arg: 'showError' } },
    optionClass: { control: false },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-lg p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`<BaseRadioGroup v-model="contact" legend="Mode de contact" :options="options" />`. Modèle string | undefined fourni par le parent, sans sélection par défaut. Options : value unique et stable, label, description?/disabled?. id/name/help/error/required/disabled optionnels. name est généré si absent ; utiliser des noms distincts pour des groupes indépendants. Attributs et événements natifs vont au fieldset. optionClass habille chaque label en carte ; le slot description reçoit option/selected/disabled, sans lien ni bouton imbriqué. Les cartes gardent le même contrôle natif. Le formulaire explique l’astérisque, gère validation et annonces. Les essais web ne remplacent pas VoiceOver/TalkBack et les WebViews Android/iOS.',
      },
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs<RadioStoryArgs>()
    return {
      components: { BaseRadioGroup },
      setup() {
        const fieldProps = computed(() => {
          const { showHelp, showError, ...props } = args
          return {
            ...props,
            help: showHelp ? props.help : undefined,
            error: showError ? props.error : undefined,
          }
        })
        const updateValue = (modelValue: string | undefined) => updateArgs({ modelValue })
        return { fieldProps, updateValue }
      },
      template: '<BaseRadioGroup v-bind="fieldProps" @update:model-value="updateValue" />',
    }
  },
} satisfies Meta<RadioStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LongOptions: Story = {
  name: 'Options longues',
  args: {
    legend: 'Choisissez la fréquence qui correspond à vos besoins',
    optionClass:
      'rounded-lg border border-epolia-primary px-epolia-sm has-checked:bg-epolia-secondary-hover',
    options: [
      {
        value: 'weekly',
        label:
          'Recevoir une synthèse hebdomadaire des nouvelles propositions correspondant à mes préférences',
        description: 'Une sélection regroupée dans un seul message, chaque semaine.',
      },
      {
        value: 'monthly',
        label: 'Recevoir uniquement un récapitulatif mensuel',
        description: 'Un aperçu des nouveautés pour prendre le temps de décider.',
      },
    ],
  },
}
