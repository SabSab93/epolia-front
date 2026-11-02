import { computed, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseStepper, { type StepperStep } from '@/shared/components/BaseStepper.vue'
import BaseHeader from '@/shared/components/BaseHeader.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type StepperStoryArgs = {
  steps: StepperStep[]
  currentStepId: string
  label: string
}

export const onboardingSteps: StepperStep[] = [
  { id: 'identity', label: 'Identité', completed: true },
  { id: 'studies', label: 'Études', completed: true },
  { id: 'proof', label: 'Justificatif', completed: true },
  { id: 'skills', label: 'Compétences' },
  { id: 'pricing', label: 'Tarif et présentation' },
  { id: 'recap', label: 'Récapitulatif' },
]

export const longLabelSteps: StepperStep[] = [
  { id: 'a', label: 'Informations personnelles et coordonnées de contact', completed: true },
  { id: 'b', label: 'Établissement, formation et niveau d’études en cours', completed: true },
  { id: 'c', label: 'Justificatif de scolarité et vérification par l’équipe Epolia' },
  { id: 'd', label: 'Compétences, services proposés et matériel fourni' },
]

const meta = {
  title: 'Shared/BaseStepper',
  component: BaseStepper,
  tags: ['autodocs'],
  excludeStories: ['onboardingSteps', 'longLabelSteps', 'renderComposition'],
  args: {
    steps: onboardingSteps,
    currentStepId: 'skills',
    label: 'Progression du parcours',
  },
  argTypes: {
    steps: { name: 'Étapes', control: 'object' },
    currentStepId: {
      name: 'Étape courante',
      control: 'select',
      options: onboardingSteps.map((step) => step.id),
    },
    label: { name: 'Nom de la navigation', control: 'text' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-sm p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Progression d’un parcours en étapes nommées, pour l’application mobile : une ligne « Étape n sur N · libellé » et une barre, comme sur la maquette. **Trois responsabilités séparées** : la *progression visuelle* (barre) ne dépend que de la position de l’étape courante ; la *complétude réelle* vient uniquement du champ `completed` fourni par le consommateur, une étape antérieure non terminée est annoncée « À compléter » ; la *navigation* n’existe pas dans ce composant, il est purement informatif (aucun bouton, aucun événement). **API** : `steps` (`{ id, label, completed? }`, ids uniques), `currentStepId`, `label` (nom de la navigation, « Progression du parcours »), `summary` et `statusLabels` pour adapter les textes. Pas de `v-model` : le composant ne change jamais l’étape courante, ne conserve aucune progression, ne fait aucun appel API et n’applique aucune règle métier ; l’écran décide quand l’utilisateur peut avancer, revenir en arrière et ce qui est enregistré. **Accessibilité** : `<nav>` nommé, résumé annoncé poliment à chaque changement d’étape, et liste de toutes les étapes avec leur état (« Identité : Terminée ») réservée aux lecteurs d’écran, avec `aria-current="step"` sur l’étape courante ; l’état ne dépend donc pas de la couleur. **Mobile** : texte en `rem` donc agrandi avec la taille du texte, libellés longs à la ligne sans coupure, mouvement réduit respecté, mode contraste forcé pris en charge. Le composant n’est pas interactif : aucune cible tactile ni parcours clavier. **Limites** : les essais navigateur ne couvrent pas les appareils Android/iOS ni VoiceOver/TalkBack. Exemple : `<BaseStepper :steps="steps" current-step-id="skills" />`.',
      },
    },
  },
  render: (args) => ({
    components: { BaseStepper },
    setup: () => ({ args }),
    template: `<BaseStepper :steps="args.steps" :current-step-id="args.currentStepId" :label="args.label" />`,
  }),
} satisfies Meta<StepperStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { name: 'Milieu du parcours' }
export const Start: Story = {
  name: 'Début du parcours',
  args: {
    currentStepId: 'identity',
    steps: onboardingSteps.map((step) => ({ id: step.id, label: step.label })),
  },
}
export const End: Story = { name: 'Fin du parcours', args: { currentStepId: 'recap' } }
export const LongLabels: Story = {
  name: 'Libellés longs',
  args: { steps: longLabelSteps, currentStepId: 'c' },
}

export function renderComposition(args: StepperStoryArgs) {
  return {
    components: { BaseStepper, BaseHeader, BaseButton },
    setup() {
      const index = ref(
        Math.max(
          0,
          args.steps.findIndex((step) => step.id === args.currentStepId),
        ),
      )
      const done = ref(new Set(args.steps.filter((step) => step.completed).map((step) => step.id)))
      const steps = computed(() =>
        args.steps.map((step) => ({ ...step, completed: done.value.has(step.id) })),
      )
      const current = computed(() => steps.value[index.value]!)
      const isFirst = computed(() => index.value === 0)
      const isLast = computed(() => index.value === steps.value.length - 1)
      function next() {
        done.value = new Set(done.value).add(current.value.id)
        if (!isLast.value) index.value += 1
      }
      function previous() {
        if (!isFirst.value) index.value -= 1
      }
      return { args, steps, current, isFirst, isLast, next, previous }
    },
    template: `
      <main class="flex min-w-0 flex-col gap-epolia-lg">
        <BaseHeader :title="current.label" level="h2" />
        <BaseStepper :steps="steps" :current-step-id="current.id" :label="args.label" />
        <p class="text-epolia-body">Contenu de l’étape « {{ current.label }} » fourni par l’écran.</p>
        <div class="flex flex-wrap gap-epolia-xs">
          <BaseButton label="Précédent" variant="secondary" :disabled="isFirst" @click="previous" />
          <BaseButton :label="isLast ? 'Terminer' : 'Continuer'" @click="next" />
        </div>
      </main>
    `,
  }
}

export const Composition: Story = {
  name: 'Exemple de composition',
  args: { currentStepId: 'proof' },
  render: (args) => renderComposition(args as StepperStoryArgs),
}
