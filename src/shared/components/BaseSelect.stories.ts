import { computed, ref } from 'vue'
import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type SelectStoryArgs = InstanceType<typeof BaseSelect>['$props'] & {
  showHelp: boolean
  showError: boolean
  empty: boolean
  testForm: boolean
}

const meta = {
  title: 'Shared/BaseSelect',
  component: BaseSelect,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: 'Fréquence des notifications',
    name: 'frequency',
    placeholder: 'Choisir une fréquence',
    options: [
      { value: 'weekly', label: 'Chaque semaine' },
      { value: 'monthly', label: 'Chaque mois' },
      { value: 'daily', label: 'Chaque jour — bientôt disponible', disabled: true },
    ],
    required: false,
    disabled: false,
    showHelp: false,
    showError: false,
    empty: false,
    testForm: false,
    help: 'Vous pourrez modifier ce choix à tout moment.',
    error: 'Choisissez une fréquence.',
  },
  argTypes: {
    modelValue: { control: 'text' },
    options: { control: 'object' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    empty: { name: 'Liste vide', control: 'boolean' },
    testForm: { name: 'Tester le formulaire', control: 'boolean' },
    showHelp: { name: 'Afficher l’aide', control: 'boolean' },
    showError: { name: 'Afficher l’erreur', control: 'boolean' },
    help: { control: 'text', if: { arg: 'showHelp' } },
    error: { control: 'text', if: { arg: 'showError' } },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-lg p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`<BaseSelect v-model="frequency" label="Fréquence" :options="options" />`. Modèle string fourni par le parent ; chaîne vide = absence de choix. Options en lecture seule : value unique/non vide, label et disabled?. id/name/form/placeholder/help/error/required/disabled optionnels ; attributs et événements natifs transmis au select. Une option retirée ne remplace pas le modèle parent ; le formulaire doit corriger une valeur devenue indisponible. La liste vide ou entièrement indisponible désactive le champ. Le choix vide reste sélectionnable si facultatif. Le formulaire explique l’astérisque et gère les messages de validation. Un reset natif répercute la valeur réinitialisée dans le modèle. Le vrai select assure clavier/menu OS et formulaire ; une surface aria-hidden montre sa valeur sur plusieurs lignes. En couleurs forcées, le select natif redevient visible. Les options du menu restent rendues par l’OS : vérifier les libellés réels avant sélection sur Android/iOS/iPadOS, notamment ceux qui ne diffèrent qu’à la fin. Reka a été évalué ; il n’est pas nécessaire pour ce comportement natif. Aucun menu ARIA fait main, autocomplétion distante ou multisélection.',
      },
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs<SelectStoryArgs>()
    return {
      components: { BaseSelect, BaseButton },
      setup() {
        const fieldProps = computed(() => {
          const { showHelp, showError, empty, testForm: _testForm, ...props } = args
          void _testForm
          return {
            ...props,
            options: empty ? [] : props.options,
            help: showHelp ? props.help : undefined,
            error: showError ? props.error : undefined,
          }
        })
        const updateValue = (modelValue: string) => updateArgs({ modelValue })
        const feedback = ref('')
        function submit() {
          feedback.value = `Valeur transmise : ${args.modelValue || '(aucune)'}`
        }
        return { args, fieldProps, updateValue, feedback, submit }
      },
      template: `<form class="flex min-w-0 flex-col gap-epolia-md" @submit.prevent="submit" @reset="feedback = ''">
        <p v-if="args.required" class="text-epolia-body-small text-epolia-text-secondary">Les champs marqués d’un * sont obligatoires.</p>
        <BaseSelect v-bind="fieldProps" @update:model-value="updateValue" />
        <div v-if="args.testForm" class="flex flex-wrap gap-epolia-xs">
          <BaseButton label="Valider" type="submit" />
          <BaseButton label="Réinitialiser" type="reset" variant="secondary" />
        </div>
        <p v-if="args.testForm" role="status" class="text-epolia-body-small">{{ feedback }}</p>
      </form>`,
    }
  },
} satisfies Meta<SelectStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LongOptions: Story = {
  name: 'Options longues',
  args: {
    label: 'Choisissez la fréquence qui correspond à vos préférences de notification',
    modelValue: 'weekly',
    options: [
      {
        value: 'weekly',
        label:
          'Recevoir un récapitulatif des nouvelles propositions correspondant à mes préférences — chaque semaine',
      },
      {
        value: 'monthly',
        label:
          'Recevoir un récapitulatif des nouvelles propositions correspondant à mes préférences — chaque mois',
      },
      { value: 'none', label: 'Ne recevoir aucune notification' },
    ],
  },
}
