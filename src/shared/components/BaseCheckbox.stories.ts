import { computed } from 'vue'
import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseCheckbox from '@/shared/components/BaseCheckbox.vue'

export type CheckboxStoryArgs = InstanceType<typeof BaseCheckbox>['$props'] & {
  showHelp: boolean
  showError: boolean
}

const meta = {
  title: 'Shared/BaseCheckbox',
  component: BaseCheckbox,
  tags: ['autodocs'],
  args: {
    modelValue: false,
    label: 'Recevoir les nouveautés',
    required: false,
    disabled: false,
    showHelp: false,
    showError: false,
    help: 'Ce choix reste facultatif.',
    error: 'Vérifiez ce choix.',
  },
  argTypes: {
    modelValue: { control: 'boolean' },
    label: { control: 'text' },
    showHelp: { name: 'Afficher l’aide', control: 'boolean' },
    showError: { name: 'Afficher l’erreur', control: 'boolean' },
    help: { control: 'text', if: { arg: 'showHelp' } },
    error: { control: 'text', if: { arg: 'showError' } },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-md p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Case native à deux états : `<BaseCheckbox v-model="accepted" label="Accepter les conditions" required />`. v-model est un booléen fourni par le parent. label est obligatoire ; id/name/help/error/required/disabled sont optionnels. Les attributs natifs et événements (ex. blur) vont à la case ; aria-describedby externe est conservé. Le formulaire gère validation, annonces et textes métier. Un lien se compose à côté du label, jamais à l’intérieur. Aucun état indéterminé. Les essais Storybook web ne remplacent pas TalkBack/VoiceOver sur les WebViews Android/iOS/iPadOS.',
      },
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs<CheckboxStoryArgs>()
    return {
      components: { BaseCheckbox },
      setup() {
        const fieldProps = computed(() => {
          const { showHelp, showError, ...props } = args
          return {
            ...props,
            help: showHelp ? props.help : undefined,
            error: showError ? props.error : undefined,
          }
        })
        function updateValue(modelValue: boolean) {
          updateArgs({ modelValue })
        }
        return { fieldProps, updateValue }
      },
      template: '<BaseCheckbox v-bind="fieldProps" @update:model-value="updateValue" />',
    }
  },
} satisfies Meta<CheckboxStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Required: Story = {
  name: 'Obligatoire',
  args: {
    required: true,
    label: 'J’accepte les conditions d’utilisation',
    help: 'Consultez les conditions avant de les accepter.',
    error: 'Acceptez les conditions pour continuer.',
  },
}
export const Disabled: Story = { name: 'Désactivé', args: { disabled: true } }
export const LongLabel: Story = {
  name: 'Texte long',
  args: {
    label:
      'Recevoir les nouvelles missions correspondant à mes préférences et aux disponibilités que j’ai renseignées dans mon profil',
    help: 'Vous pourrez modifier ce choix depuis votre profil à tout moment.',
  },
}
