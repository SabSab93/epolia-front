import { computed, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseLoader from '@/shared/components/BaseLoader.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'

type LoaderStoryArgs = InstanceType<typeof BaseLoader>['$props'] & {
  buttonVariant: 'default' | 'secondary' | 'tertiary'
}

const meta = {
  title: 'Shared/BaseLoader',
  component: BaseLoader,
  tags: ['autodocs'],
  args: {
    variant: 'spinner',
    label: 'Chargement des résultats.',
    loading: true,
    decorative: false,
    buttonVariant: 'default',
  },
  argTypes: {
    variant: { control: 'select', options: ['spinner', 'linear'] },
    label: { name: 'Libellé', control: 'text' },
    loading: { name: 'Chargement', control: 'boolean' },
    decorative: { name: 'Décoratif', control: 'boolean' },
    buttonVariant: { table: { disable: true } },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-lg p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Deux indicateurs indéterminés, sans pourcentage ni Skeleton. Le libellé reste visible en mode autonome. Garder BaseLoader monté avec loading=false avant de passer à true pour préparer la région status. En mode décoratif, le parent fournit l’information accessible. Le parent gère aria-busy sur la zone concernée ; une annonce immédiate reste hors de cette zone. Aucun délai, appel API ou déplacement du focus. La réduction du mouvement arrête les animations ; garder un texte d’attente visible dans le parent en mode décoratif. Les essais VoiceOver/TalkBack sur appareil restent à effectuer.',
      },
    },
  },
  render: (args) => ({
    components: { BaseLoader },
    setup() {
      const loaderProps = computed(() => ({
        variant: args.variant,
        label: args.label,
        loading: args.loading,
        decorative: args.decorative,
      }))
      return { loaderProps }
    },
    template: '<BaseLoader v-bind="loaderProps" />',
  }),
} satisfies Meta<LoaderStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const InControl = {
  name: 'Dans un contrôle',
  argTypes: {
    variant: { table: { disable: true } },
    label: { table: { disable: true } },
    loading: { table: { disable: true } },
    decorative: { table: { disable: true } },
    buttonVariant: {
      name: 'Variante du bouton',
      control: 'select',
      options: ['default', 'secondary', 'tertiary'],
      table: { disable: false },
    },
  },
  render: (args) => ({
    components: { BaseButton, BaseInput },
    setup() {
      const name = ref('Exemple')
      const state = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
      const loading = computed(() => state.value === 'loading')
      const message = computed(() => {
        if (state.value === 'loading') return 'Enregistrement en cours.'
        if (state.value === 'success') return 'Exemple enregistré.'
        if (state.value === 'error') return 'Enregistrement impossible. Réessayez.'
        return ''
      })
      return { args, name, state, loading, message }
    },
    template: `
      <div class="flex min-w-0 flex-col gap-epolia-md">
        <form :aria-busy="loading || undefined" class="flex min-w-0 flex-col gap-epolia-md" @submit.prevent="state = 'loading'">
          <BaseInput v-model="name" label="Nom de l’exemple" :clearable="false" />
          <BaseButton type="submit" label="Enregistrer" :variant="args.buttonVariant" :loading="loading" class="self-start" />
        </form>
        <p role="status" aria-atomic="true" class="text-epolia-body">{{ message }}</p>
        <div class="flex flex-wrap gap-epolia-xs">
          <BaseButton label="Simuler la réussite" variant="secondary" @click="state = 'success'" />
          <BaseButton label="Simuler l’échec" variant="secondary" @click="state = 'error'" />
        </div>
      </div>
    `,
  }),
} satisfies Story
