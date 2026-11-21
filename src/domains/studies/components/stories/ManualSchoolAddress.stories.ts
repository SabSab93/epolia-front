import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ManualSchoolAddress from '@/domains/studies/components/ManualSchoolAddress.vue'
import ManualEducationTitle from '@/domains/studies/components/ManualEducationTitle.vue'
import BaseInput from '@/shared/components/BaseInput.vue'

const meta = {
  title: 'Études/Adresse de l’établissement',
  id: 'etudes-adresse-etablissement',
  component: ManualSchoolAddress,
  args: { modelValue: '' },
  render: () => ({
    components: { BaseInput, ManualSchoolAddress, ManualEducationTitle },
    setup() {
      return { school: ref('My Digital School Grenoble'), address: ref(''), title: ref('') }
    },
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-epolia-lg bg-epolia-page p-epolia-md">
        <BaseInput v-model="school" label="Établissement" required />
        <ManualSchoolAddress v-model="address" />
        <ManualEducationTitle v-model="title" />
      </div>`,
  }),
} satisfies Meta<typeof ManualSchoolAddress>

export default meta
export const SaisieManuelle: StoryObj<typeof meta> = {}
