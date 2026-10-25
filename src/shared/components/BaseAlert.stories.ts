import { computed, ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

export type AlertStoryArgs = InstanceType<typeof BaseAlert>['$props'] & {
  showTitle: boolean
  dynamic: boolean
}

const meta = {
  title: 'Shared/BaseAlert',
  component: BaseAlert,
  tags: ['autodocs'],
  args: {
    variant: 'info',
    message: 'Complétez votre profil pour présenter vos services.',
    title: 'Votre profil',
    announcement: 'off',
    showTitle: false,
    dynamic: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
    showTitle: { name: 'Afficher le titre', control: 'boolean' },
    title: { control: 'text', if: { arg: 'showTitle' } },
    message: { name: 'Message', control: 'text' },
    announcement: { control: 'select', options: ['off', 'polite', 'assertive'] },
    dynamic: { name: 'Tester un message dynamique', control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-lg p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Message intégré et persistant, sans action ni fermeture automatique. message est requis (chaîne vide pour préparer une annonce), title est facultatif et reste un paragraphe. variant ne détermine pas l’urgence. announcement : off par défaut pour un contenu initial, polite pour un résultat non urgent, assertive pour une urgence réelle. Pour tester une annonce, choisir le mode, activer le test dynamique puis afficher le message : garder la région montée avant sa mise à jour. Le texte doit rester compréhensible sans couleur. Ne pas ajouter une seconde région live autour du composant. Les essais VoiceOver/TalkBack natifs restent à effectuer.',
      },
    },
  },
  render: (args) => ({
    components: { BaseAlert, BaseButton },
    setup() {
      const visible = ref(false)
      watch(
        () => args.dynamic,
        () => {
          visible.value = false
        },
      )
      const alertProps = computed(() => {
        const { showTitle, dynamic, ...props } = args
        return {
          ...props,
          title: showTitle ? props.title : undefined,
          message: dynamic && !visible.value ? '' : props.message,
        }
      })
      return { args, visible, alertProps }
    },
    template: `
      <div class="flex min-w-0 flex-col gap-epolia-md">
        <BaseButton v-if="args.dynamic" class="self-start" :label="visible ? 'Effacer le message' : 'Afficher le message'" @click="visible = !visible" />
        <BaseAlert v-bind="alertProps" />
      </div>
    `,
  }),
} satisfies Meta<AlertStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const LongText: Story = {
  name: 'Texte long',
  args: {
    variant: 'error',
    title: 'Votre profil n’a pas pu être enregistré',
    showTitle: true,
    message:
      'La connexion au service est temporairement indisponible. Réessayez dans quelques instants.\nSi le problème persiste, contactez l’assistance en précisant l’action que vous souhaitiez effectuer.',
  },
}
