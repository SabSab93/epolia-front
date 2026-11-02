import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import meta, {
  MapPreview,
  Profile,
  type AvatarStoryArgs,
} from '@/shared/components/BaseAvatar.stories'

enableAutoUnmount(afterEach)

it('keeps identity Controls and fallback synchronized without inventing a portfolio', async () => {
  const args = reactive<AvatarStoryArgs>({ ...meta.args, alt: 'Profil de démonstration' })
  const wrapper = mount(meta.render(args))
  expect(wrapper.getComponent(BaseAvatar).attributes('aria-label')).toBe(args.alt)
  Object.assign(args, { src: '', alt: '', size: 'sm', shape: 'rounded', showWork: false })
  await nextTick()
  const avatar = wrapper.getComponent(BaseAvatar)
  expect(avatar.attributes('aria-hidden')).toBe('true')
  expect(avatar.attributes('data-size')).toBe('sm')
  expect(avatar.attributes('data-shape')).toBe('rounded')
  expect(avatar.text()).toBe('CD')
  expect(wrapper.find('img').exists()).toBe(false)
  expect(wrapper.text()).toContain(args.serviceLabel)
  expect(wrapper.text()).toContain(args.displayName)
  expect(wrapper.text()).toContain('22 € / h')
})

it('opens a profile, switches tabs by keyboard and restores the search trigger', async () => {
  const args = reactive<AvatarStoryArgs>({ ...meta.args })
  const wrapper = mount(meta.render(args), { attachTo: document.body })
  await wrapper.get('[data-profile="camille"]').trigger('click')
  expect(wrapper.get('h2').text()).toBe(args.displayName)
  expect(document.activeElement).toBe(wrapper.get('h2').element)
  const tabs = wrapper.findAll('[role="tab"]')
  expect(tabs[0]!.attributes('aria-selected')).toBe('true')
  expect(wrapper.findAll('figure')).toHaveLength(2)
  await tabs[0]!.trigger('keydown', { key: 'ArrowRight' })
  expect(tabs[1]!.attributes('aria-selected')).toBe('true')
  expect(document.activeElement).toBe(tabs[1]!.element)
  expect(wrapper.findAll('.talent-reviews article')).toHaveLength(2)
  await tabs[1]!.trigger('keydown', { key: 'Home' })
  expect(tabs[0]!.attributes('aria-selected')).toBe('true')
  await wrapper.get('button[aria-label="Contacter Camille D."]').trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain('aucun message n’a été envoyé')
  await wrapper.get('.talent-back').trigger('click')
  expect(wrapper.find('h2').exists()).toBe(false)
  expect(document.activeElement).toBe(wrapper.get('[data-profile="camille"]').element)
})

it('keeps the profile readable without a photo or published work', () => {
  const args: AvatarStoryArgs = {
    ...meta.args,
    ...Profile.args,
    src: '',
    initials: '',
    showWork: false,
    displayName: 'Camille — profil de démonstration avec un nom public particulièrement long',
  }
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('h2').text()).toBe(args.displayName)
  expect(wrapper.getComponent(BaseAvatar).text()).toBe('?')
  expect(wrapper.find('img').exists()).toBe(false)
  expect(wrapper.find('figure').exists()).toBe(false)
  expect(wrapper.text()).toContain('Aucune réalisation publiée pour le moment.')
})

it('closes the map preview with Escape, restores its pin and can open the same profile', async () => {
  const args = { ...meta.args, ...MapPreview.args }
  const wrapper = mount(meta.render(args), { attachTo: document.body })
  const pin = wrapper.get('button[aria-expanded]')
  expect(pin.text()).toBe('22 € / h')
  await wrapper.get('.talent-sheet').trigger('keydown', { key: 'Escape' })
  expect(wrapper.find('.talent-sheet').exists()).toBe(false)
  expect(pin.attributes('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(pin.element)
  await pin.trigger('click')
  expect(wrapper.find('.talent-sheet').exists()).toBe(true)
  expect(document.activeElement).toBe(wrapper.get('.talent-focus-target').element)
  await wrapper.get('.talent-sheet > button').trigger('click')
  expect(wrapper.get('h2').text()).toBe(args.displayName)
  expect(wrapper.text()).toContain('22 € / h')
  await wrapper.get('.talent-back').trigger('click')
  expect(wrapper.find('.talent-sheet').exists()).toBe(true)
  expect(document.activeElement?.textContent).toBe('Voir le profil')
})

it('keeps each result distinct and favorites local to the demonstration', async () => {
  const wrapper = mount(meta.render({ ...meta.args }))
  const favorite = wrapper.get('button[aria-label="Ajouter Sasha M. aux favoris"]')
  await favorite.trigger('click')
  expect(favorite.attributes('aria-pressed')).toBe('true')
  expect(wrapper.get('[role="status"]').text()).toContain('Sasha M. ajouté')
  await wrapper.get('[data-profile="sasha"]').trigger('click')
  expect(wrapper.get('h2').text()).toBe('Sasha M.')
  expect(wrapper.text()).toContain('25 € / h')
  expect(wrapper.text()).toContain('En formation en communication visuelle')
  expect(wrapper.findAll('figure')).toHaveLength(1)
  expect(wrapper.text()).toContain('Identité d’un atelier')
  await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
  expect(wrapper.get('.talent-reviews').text()).toContain('Jules B.')
  expect(wrapper.get('.talent-reviews').text()).not.toContain('Alex P.')
  expect(wrapper.getComponent(BaseAvatar).text()).toBe('SM')
})
