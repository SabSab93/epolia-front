import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from 'storybook/test'
import BaseProfilePhotoPicker from '@/shared/components/BaseProfilePhotoPicker.vue'
import avatarDemo from '@/assets/images/avatar-camille-demo.webp'

const meta = {
  title: 'Shared/BaseProfilePhotoPicker',
  component: BaseProfilePhotoPicker,
  tags: ['autodocs'],
  args: {
    modelValue: null,
    initials: 'CD',
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 5_000_000,
  },
  argTypes: { modelValue: { control: false } },
  decorators: [() => ({ template: '<div class="w-full max-w-md p-epolia-md"><story /></div>' })],
  parameters: {
    docs: {
      description: {
        component:
          'Sélecteur local avec aperçu. Le parent utilise v-model avec un File ou null et fournit les types MIME et la taille maximale en octets. Les formats et les 5 Mo affichés ici servent à la démonstration. Le fichier sélectionné reste à enregistrer par le formulaire qui utilise le composant.',
      },
    },
  },
  render: (args) => ({
    components: { BaseProfilePhotoPicker },
    setup: () => ({ args, photo: ref<File | null>(args.modelValue) }),
    template: '<BaseProfilePhotoPicker v-bind="args" v-model="photo" />',
  }),
} satisfies Meta<typeof BaseProfilePhotoPicker>

export default meta
type Story = StoryObj<typeof meta>

function selectFile(canvasElement: HTMLElement, file: File) {
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!
  const transfer = new DataTransfer()
  transfer.items.add(file)
  input.files = transfer.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function selectDemoPhoto(canvasElement: HTMLElement) {
  const image = await (await fetch(avatarDemo)).blob()
  selectFile(canvasElement, new File([image], 'portrait.webp', { type: 'image/webp' }))
  return within(canvasElement).findByRole('button', { name: 'Retirer la photo' })
}

export const Default: Story = { name: 'Sans photo' }

export const Selected: Story = {
  name: 'Photo sélectionnée',
  play: async ({ canvasElement }) => {
    await selectDemoPhoto(canvasElement)
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Aperçu local')
  },
}

export const Invalid: Story = {
  name: 'Format refusé',
  play: async ({ canvasElement }) => {
    selectFile(canvasElement, new File(['Exemple'], 'exemple.txt', { type: 'text/plain' }))
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Choisissez une image')
  },
}

export const Removed: Story = {
  name: 'Photo retirée',
  play: async ({ canvasElement, userEvent }) => {
    const remove = await selectDemoPhoto(canvasElement)
    await userEvent.click(remove)
    await expect(
      within(canvasElement).getByRole('button', { name: 'Choisir une photo' }),
    ).toHaveFocus()
  },
}
