import { nextTick, ref, useTemplateRef } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseTag from '@/shared/components/BaseTag.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'

export type TagStoryArgs = InstanceType<typeof BaseTag>['$props'] & { showIcon: boolean }

// Slot illustration only; the shared icon solution remains tracked in #15.
const ExampleIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" focusable="false"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>',
}

const meta = {
  title: 'Shared/BaseTag',
  component: BaseTag,
  tags: ['autodocs'],
  args: { label: 'Design graphique', clearable: false, disabled: false, showIcon: false },
  argTypes: {
    label: { name: 'Libellé', control: 'text' },
    clearable: { name: 'Afficher la croix', control: 'boolean' },
    disabled: { name: 'Désactivé', control: 'boolean' },
    showIcon: { name: 'Icône à gauche', control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-xl p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`<BaseTag label="Design" clearable @remove="removeTag" />`. Props : label requis, clearable/disabled false par défaut. Événement remove sans payload ; aucun v-model ni suppression automatique. Slot icon décoratif à gauche : fournir une icône non interactive, les informations essentielles restant dans le libellé. Une couleur unique utilise les tokens Epolia. Le parent dispose la liste, annonce les changements et gère le focus après retrait. La croix textuelle de 24 px reprend BaseInput/BaseSelect ; la mutualisation BaseIcon reste à réaliser dans #15. Le SVG des stories illustre uniquement le slot. Aucune validation Android/iOS ou lecteur d’écran mobile revendiquée.',
      },
    },
  },
  render: (args) => ({
    components: { BaseTag, BaseButton, ExampleIcon },
    setup() {
      const visible = ref(true)
      const feedback = ref('')
      const restore = useTemplateRef<InstanceType<typeof BaseButton>>('restore')
      const tag = useTemplateRef<InstanceType<typeof BaseTag>>('tag')
      async function restoreTag() {
        visible.value = true
        feedback.value = ''
        await nextTick()
        tag.value?.$el.querySelector('button')?.focus()
      }
      async function remove() {
        visible.value = false
        feedback.value = `${args.label} retiré.`
        await nextTick()
        restore.value?.$el.focus()
      }
      return { args, visible, feedback, remove, restoreTag }
    },
    template: `<div class="flex min-w-0 flex-col items-start gap-epolia-xs">
      <BaseTag v-if="visible" ref="tag" :label="args.label" :clearable="args.clearable" :disabled="args.disabled" @remove="remove">
        <template v-if="args.showIcon" #icon><ExampleIcon /></template>
      </BaseTag>
      <BaseButton v-else ref="restore" label="Réafficher le tag" variant="secondary" @click="restoreTag" />
      <p role="status" class="text-epolia-body-small text-epolia-text-secondary">{{ feedback }}</p>
    </div>`,
  }),
} satisfies Meta<TagStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
const renderTagList = (args: TagStoryArgs) => ({
  components: { BaseTag, BaseInput, BaseButton, ExampleIcon },
  setup() {
    const items = ref([
      { id: 0, label: '' },
      { id: 1, label: 'Design graphique' },
      { id: 2, label: 'Développement web' },
    ])
    let nextId = 3
    const draft = ref('')
    const feedback = ref('')
    const list = useTemplateRef<HTMLUListElement>('list')
    const entry = useTemplateRef<InstanceType<typeof BaseInput>>('entry')
    const label = (item: { id: number; label: string }) => (item.id === 0 ? args.label : item.label)
    function focusEntry() {
      entry.value?.$el.querySelector('input')?.focus()
    }
    async function remove(id: number) {
      const index = items.value.findIndex((item) => item.id === id)
      if (index < 0 || args.disabled) return
      feedback.value = `${label(items.value[index]!)} retiré.`
      items.value.splice(index, 1)
      await nextTick()
      const buttons = list.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      const target = buttons?.[Math.min(index, buttons.length - 1)]
      if (target) target.focus()
      else focusEntry()
    }
    async function add() {
      const value = draft.value.trim()
      if (!value || args.disabled) return
      items.value.push({ id: nextId++, label: value })
      feedback.value = `${value} ajouté.`
      draft.value = ''
      await nextTick()
      focusEntry()
    }
    return { args, items, draft, feedback, label, remove, add }
  },
  template: `<form class="flex min-w-0 flex-col gap-epolia-md" @submit.prevent="add">
      <ul ref="list" aria-label="Libellés de démonstration" class="flex min-w-0 flex-wrap gap-epolia-xs">
        <li v-for="item in items" :key="item.id" class="min-w-0 max-w-full">
          <BaseTag :label="label(item)" :clearable="args.clearable" :disabled="args.disabled" @remove="remove(item.id)">
            <template v-if="args.showIcon" #icon><ExampleIcon /></template>
          </BaseTag>
        </li>
      </ul>
      <p role="status" class="text-epolia-body-small text-epolia-text-secondary">{{ feedback }}</p>
      <BaseInput ref="entry" v-model="draft" label="Ajouter un libellé pour la démonstration" :disabled="args.disabled" />
      <BaseButton type="submit" label="Ajouter" class="self-start" :disabled="!draft.trim() || args.disabled" />
    </form>`,
})

export const LongLabel = {
  name: 'Libellé long et liste',
  args: {
    label: 'Conception et développement d’interfaces accessibles sur mobile et sur le web',
    clearable: true,
    showIcon: true,
  },
  render: renderTagList,
} satisfies Story
