import type { Meta, StoryObj } from '@storybook/vue3'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import AvatarProfileExample, {
  type AvatarProfileExampleProps,
} from '@/storybook/examples/AvatarProfileExample.vue'
import { portrait as avatarDemo } from '@/storybook/examples/avatarGallery.data'

export type AvatarStoryArgs = AvatarProfileExampleProps

const meta = {
  title: 'Shared/BaseAvatar',
  component: BaseAvatar,
  tags: ['autodocs'],
  args: {
    src: avatarDemo,
    alt: '',
    initials: 'CD',
    size: 'md',
    shape: 'circle',
    presentation: 'search',
    displayName: 'Camille D.',
    serviceLabel: 'Affiches & identité visuelle',
    showWork: true,
  },
  argTypes: {
    src: { name: 'Photo de profil (vide : repli)', control: 'text' },
    alt: { name: 'Alternative (vide : nom déjà présent)', control: 'text' },
    initials: { name: 'Initiales publiques', control: 'text' },
    size: { name: 'Taille de l’avatar', control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { name: 'Forme de l’avatar', control: 'select', options: ['circle', 'rounded'] },
    presentation: { table: { disable: true }, control: false },
    displayName: { name: 'Nom public', control: 'text' },
    serviceLabel: { name: 'Prestation', control: 'text' },
    showWork: { name: 'Réalisations disponibles', control: 'boolean' },
  },
  decorators: [() => ({ template: '<div class="w-full max-w-sm p-epolia-md"><story /></div>' })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Avatar Reka non interactif : src facultatif, alt requis (vide si le nom adjacent suffit), initiales explicites limitées à deux graphèmes. Tailles sm/md/lg/xl : 32/48/64/96 px à 16 px de base ; formes circle/rounded. Repli neutre « ? » pendant le chargement et après erreur. Trois vues mobiles suivent la direction Immersion créative retenue : Recherche, aperçu Carte, Profil. Photos générées fictives, optimisées localement ; carte illustrative sans géolocalisation. Les résultats possèdent un cartouche blanc sur leur photo et ouvrent le profil au clic. Le profil utilise une couverture graphique Epolia décorative par défaut, distincte de la photo et des réalisations. Fermer l’aperçu rend le focus au repère ; les onglets du profil fonctionnent au clavier. Toutes leurs données sont fictives ; les informations de profil ne sont pas des props de BaseAvatar. Les actions, favoris et navigation restent des démonstrations locales sans API. Sans réalisation, fond neutre sans portfolio inventé. Pour une photo invalide : data:image/png;base64,aW52YWxpZA==. Les pages métier et essais natifs restent séparés.',
      },
    },
  },
  render: (args) => ({
    components: { AvatarProfileExample },
    setup: () => ({ args }),
    template: '<AvatarProfileExample v-bind="args" />',
  }),
} satisfies Meta<AvatarStoryArgs>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { name: 'Recherche' }
export const MapPreview: Story = {
  name: 'Carte',
  args: { presentation: 'map' },
}
export const Profile: Story = {
  name: 'Profil',
  args: { presentation: 'profile', size: 'xl' },
}
