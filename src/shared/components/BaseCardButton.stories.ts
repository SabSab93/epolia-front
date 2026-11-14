import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { useArgs } from 'storybook/preview-api'
import BaseCardButton from '@/shared/components/BaseCardButton.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const meta = {
  title: 'Shared/BaseCardButton',
  component: BaseCardButton,
  tags: ['autodocs'],
  args: {
    title: 'Je suis particulier',
    description:
      'Décrivez votre besoin et trouvez un étudiant pour vous aider, par exemple pour des cours, un dépannage informatique ou un projet créatif.',
    selected: false,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    selected: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Carte cliquable avec un titre BaseTitle h2 et une description. Le parent contrôle la sélection via selected et réagit à l’événement click.',
      },
    },
  },
  decorators: [() => ({ template: '<div class="mx-auto max-w-2xl p-epolia-md"><story /></div>' })],
} satisfies Meta<typeof BaseCardButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Carte seule',
  render: (args) => {
    const [, updateArgs] = useArgs<{ selected: boolean }>()

    return {
      components: { BaseCardButton, BaseTitle },
      setup() {
        return { args, toggle: () => updateArgs({ selected: !args.selected }) }
      },
      template: `<div class="grid max-w-sm gap-epolia-lg">
        <BaseTitle level="h1">Choisir un compte</BaseTitle>
        <BaseCardButton v-bind="args" @click="toggle" />
      </div>`,
    }
  },
}

export const AccountChoices: Story = {
  name: 'Choix du compte',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { BaseCardButton, BaseTitle },
    setup() {
      const selected = ref<'particulier' | 'étudiant'>()
      const customer = meta.args
      return { selected, customer }
    },
    template: `<div class="grid gap-epolia-lg">
      <BaseTitle level="h1">Qui êtes-vous ?</BaseTitle>
      <div role="group" aria-label="Type de compte" class="grid gap-epolia-md md:grid-cols-2">
        <BaseCardButton
          :title="customer.title"
          :description="customer.description"
          :selected="selected === 'particulier'"
          @click="selected = 'particulier'"
        />
        <BaseCardButton
          title="Je suis étudiant"
          description="Présentez vos compétences, proposez vos services et choisissez des missions qui s’accordent avec votre emploi du temps."
          :selected="selected === 'étudiant'"
          @click="selected = 'étudiant'"
        />
      </div>
    </div>`,
  }),
}
