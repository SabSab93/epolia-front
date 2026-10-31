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
    clearable: true,
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
    clearable: { name: 'Effacement par la croix', control: 'boolean' },
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
          '`<BaseSelect v-model="frequency" label="Fréquence" :options="options" />`. Modèle string contrôlé ; chaîne vide = aucun choix. Options : value unique/non vide, label, disabled?. id/name/form/placeholder/help/error/required/disabled optionnels. Reka gère le menu, le clavier et le focus ; survol et parcours clavier utilisent le vert dérivé Epolia, la coche indique le choix confirmé. Les attributs et événements sont transmis au déclencheur. Un select masqué assure la soumission, la validation et le reset natifs, y compris avec form externe. Une valeur retirée ne remplace pas le modèle parent. Liste vide ou entièrement indisponible : champ désactivé. Le choix vide est proposé si facultatif. clearable (false par défaut) ajoute une croix si une valeur est sélectionnée et le champ actif ; elle vide le modèle et rend le focus au champ. Un champ obligatoire vidé reste à renseigner avant soumission. Le formulaire explique l’astérisque. Deux stories configurables ; aucun multiselect ni recherche distante. Essais Android/iOS et lecteurs d’écran mobiles à effectuer.',
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
