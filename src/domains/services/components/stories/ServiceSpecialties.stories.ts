import { useArgs } from 'storybook/preview-api'
import type { Meta, StoryObj } from '@storybook/vue3'
import ServiceSpecialties from '@/domains/services/components/ServiceSpecialties.vue'

const domainId = '65aa6725-3216-47a7-b1c8-0dad9b38ca4f'
const meta = {
  title: 'Parcours étudiant/Prestations/Spécialités',
  component: ServiceSpecialties,
  args: {
    domainId,
    domainLabel: 'Aide informatique',
    services: [
      'Dépannage Mac et PC',
      'Installation Wi-Fi et box',
      'Initiation smartphone',
      'Sauvegarde de données',
      'Configuration imprimante',
      'Nettoyage de logiciels indésirables',
    ].map((label, index) => ({ id: String(index), domainId, label })),
    selectedIds: ['0', '1', '2'],
    recommendedIds: ['0', '3'],
  },
  render: (args) => {
    const [, updateArgs] = useArgs()
    return {
      components: { ServiceSpecialties },
      setup() {
        function toggle(id: string, checked: boolean) {
          const selected = args.selectedIds.filter((value) => value !== id)
          updateArgs({ selectedIds: checked ? [...selected, id] : selected })
        }
        return { args, toggle }
      },
      template:
        '<div class="mx-auto max-w-sm"><ServiceSpecialties v-bind="args" @toggle="toggle" /></div>',
    }
  },
} satisfies Meta<typeof ServiceSpecialties>

export default meta
export const AvecSelection: StoryObj<typeof meta> = {}
export const SansSelection: StoryObj<typeof meta> = { args: { selectedIds: [] } }
