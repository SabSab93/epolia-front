import portrait from '@/assets/images/avatar-camille-demo.webp'
import work from '@/assets/images/portfolio-print-demo.webp'
import identity from '@/assets/images/portfolio-identity-demo.webp'
import map from '@/assets/images/map-demo.webp'

export { portrait, work, identity, map }

export type TalentDemoProfile = {
  id: string
  name: string
  service: string
  location: string
  photo: string
  alt: string
  initials: string
  cover: string
  price: string
  rating: string
  reviews: string
  formation: string
  bio: string
  projects: { title: string; image: string }[]
  feedback: { name: string; text: string }[]
}

export const otherProfile: TalentDemoProfile = {
  id: 'sasha',
  name: 'Sasha M.',
  service: 'Identité de marque',
  location: 'Grenoble',
  photo: '',
  alt: '',
  initials: 'SM',
  cover: identity,
  price: '25',
  rating: '4,8',
  reviews: '8',
  formation: 'En formation en communication visuelle',
  bio: 'Je conçois des identités de marque simples et cohérentes : logo, couleurs et supports de communication adaptés à votre projet.',
  projects: [{ title: 'Identité d’un atelier', image: identity }],
  feedback: [
    {
      name: 'Jules B.',
      text: 'Une identité claire, des supports cohérents et un accompagnement à l’écoute.',
    },
  ],
}

export const projects = [
  { title: 'Affiches & supports imprimés', image: work },
  { title: 'Identité visuelle', image: identity },
]

export const reviews = [
  {
    name: 'Alex P.',
    text: 'Une affiche soignée et des échanges très clairs. Le résultat correspond à mon besoin.',
  },
  { name: 'Sarah L.', text: 'Des propositions créatives et un vrai soin apporté à mon projet.' },
]
