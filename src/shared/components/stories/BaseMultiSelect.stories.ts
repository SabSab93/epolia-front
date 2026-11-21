import { computed, ref } from 'vue'
import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseMultiSelect from '@/shared/components/BaseMultiSelect.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type MultiSelectStoryArgs = InstanceType<typeof BaseMultiSelect>['$props'] & {
  showHelp: boolean
  showError: boolean
  empty: boolean
  allDisabled: boolean
  testForm: boolean
}

const meta = {
  title: 'Shared/BaseMultiSelect',
  component: BaseMultiSelect,
  tags: ['autodocs'],
  args: {
    modelValue: [],
    label: 'Compétences',
    name: 'skills',
    placeholder: 'Choisir des compétences',
    options: [
      { value: 'design', label: 'Design graphique' },
      { value: 'web', label: 'Développement web' },
      { value: 'photo', label: 'Photographie' },
      { value: 'video', label: 'Montage vidéo — bientôt disponible', disabled: true },
    ],
    required: false,
    disabled: false,
    clearable: true,
    showHelp: false,
    showError: false,
    empty: false,
    allDisabled: false,
    testForm: false,
    help: 'Vous pourrez modifier ces choix à tout moment.',
    error: 'Vérifiez les compétences sélectionnées.',
  },
  argTypes: {
    modelValue: { control: 'object' },
    options: { control: 'object' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    clearable: { name: 'Afficher la croix d’effacement', control: 'boolean' },
    empty: { name: 'Liste vide', control: 'boolean' },
    allDisabled: { name: 'Toutes les options indisponibles', control: 'boolean' },
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
          '`<BaseMultiSelect v-model="skills" label="Compétences" :options="options" name="skills" />`. Modèle contrôlé string[] ; [] signifie aucun choix. Options SelectOption (value unique/non vide, label, disabled?) partagées avec BaseSelect. Pas de mutation du tableau parent ni de choix implicite. Props optionnelles : id/name/form/placeholder/help/error/required/disabled/clearable (true par défaut). Les attributs et événements sont transmis au déclencheur. Panneau Reka Popover avec Listbox multiple ; les choix sont appliqués immédiatement ; clic extérieur, Échap ou Tab ferment sans les annuler. Les tags BaseTag restent dessous ; le composant gère leur retrait et le focus. clearable masque seulement la croix d’effacement globale, les tags et le panneau permettent toujours de désélectionner. Required impose au moins un choix. Une option désactivée ne peut pas être ajoutée, mais un choix déjà fourni reste valide, transmis et retirable. Les valeurs absentes des options restent dans le modèle, portent un libellé indisponible et doivent être retirées avant soumission. Désactivé bloque toutes les actions sans perdre les choix. Le select multiple masqué transmet plusieurs entrées sous le même name (FormData.getAll), y compris avec form externe. Le reset revient à [], et peut être annulé. Pas de recherche, de création libre, d’API ou de limite métier. BaseIcon reste différé dans #15 selon le choix de Sabrina. Les essais navigateur ne remplacent pas Android/iOS ou les lecteurs d’écran mobiles.',
      },
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs<MultiSelectStoryArgs>()
    return {
      components: { BaseMultiSelect, BaseButton },
      setup() {
        const fieldProps = computed(() => {
          const { showHelp, showError, empty, allDisabled, testForm: _testForm, ...props } = args
          void _testForm
          return {
            ...props,
            options: empty
              ? []
              : allDisabled
                ? props.options.map((option) => ({ ...option, disabled: true }))
                : props.options,
            help: showHelp ? props.help : undefined,
            error: showError ? props.error : undefined,
          }
        })
        const updateValue = (modelValue: string[]) => updateArgs({ modelValue })
        const feedback = ref('')
        function submit(event: Event) {
          const data = new FormData(event.target as HTMLFormElement)
          feedback.value = `Valeurs transmises : ${data.getAll(args.name ?? 'skills').join(', ') || '(aucune)'}`
        }
        return { args, fieldProps, updateValue, feedback, submit }
      },
      template: `<form class="flex min-w-0 flex-col gap-epolia-md" @submit.prevent="submit" @reset="feedback = ''">
        <p v-if="args.required" class="text-epolia-body-small text-epolia-text-secondary">Les champs marqués d’un * sont obligatoires.</p>
        <BaseMultiSelect v-bind="fieldProps" @update:model-value="updateValue" />
        <div v-if="args.testForm" class="flex flex-wrap gap-epolia-xs">
          <BaseButton label="Valider" type="submit" />
          <BaseButton label="Réinitialiser" type="reset" variant="secondary" />
        </div>
        <p v-if="args.testForm" role="status" class="text-epolia-body-small">{{ feedback }}</p>
      </form>`,
    }
  },
} satisfies Meta<MultiSelectStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const LongOptions: Story = {
  name: 'Options longues',
  args: {
    modelValue: ['design', 'web'],
    options: [
      {
        value: 'design',
        label: 'Design graphique et conception d’identités visuelles pour différents supports',
      },
      { value: 'web', label: 'Développement web et création d’interfaces accessibles sur mobile' },
      { value: 'photo', label: 'Photographie et retouche d’images pour les supports numériques' },
      { value: 'video', label: 'Montage vidéo — bientôt disponible', disabled: true },
    ],
  },
}
