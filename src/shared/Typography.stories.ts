import type { Meta, StoryObj } from '@storybook/vue3'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TextRoles: Story = {
  render: () => ({
    components: { BaseTitle },
    template: `<main class="bg-epolia-page text-epolia-text p-epolia-md">
      <div class="mx-auto max-w-md space-y-epolia-lg">
        <BaseTitle level="h1">Titre de page</BaseTitle>
        <BaseTitle level="h2">Titre de section</BaseTitle>
        <BaseTitle level="h3">Titre de groupe</BaseTitle>
        <BaseTitle level="h4">Titre de sous-groupe</BaseTitle>
        <p class="text-epolia-body">Un texte courant lisible, qui reste adaptable sur mobile.</p>
        <p class="text-epolia-body-small text-epolia-text-secondary">Une information secondaire.</p>
        <div class="bg-epolia-surface border border-epolia-border rounded-lg p-epolia-md">
          <p class="text-epolia-body">Surface de carte</p>
        </div>
      </div>
    </main>`,
  }),
}
