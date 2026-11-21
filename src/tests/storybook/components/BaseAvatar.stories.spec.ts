import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import meta, { Identity } from '@/shared/components/stories/BaseAvatar.stories'

enableAutoUnmount(afterEach)

it('keeps avatar Controls synchronized when switching to the fallback', async () => {
  const args = reactive({ ...meta.args })
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('.base-avatar-portrait').attributes('aria-label')).toBe(args.alt)
  Object.assign(args, { src: '', initials: '', alt: '', size: 'sm', shape: 'rounded' })
  await nextTick()
  const avatar = wrapper.getComponent(BaseAvatar)
  expect(avatar.get('.base-avatar-portrait').attributes('aria-hidden')).toBe('true')
  expect(avatar.attributes('data-size')).toBe('sm')
  expect(avatar.attributes('data-shape')).toBe('rounded')
  expect(avatar.text()).toBe('?')
  expect(wrapper.find('img').exists()).toBe(false)
})

it('composes a public name without adding identity or interactions to the avatar', () => {
  const wrapper = mount(Identity.render!({ ...meta.args, ...Identity.args }, {} as never))
  const avatar = wrapper.getComponent(BaseAvatar)
  expect(avatar.get('.base-avatar-portrait').attributes('aria-hidden')).toBe('true')
  expect(avatar.get('.base-avatar-portrait').attributes('aria-label')).toBeUndefined()
  expect(wrapper.findAll('p').map((line) => line.text())).toEqual([
    'Camille D.',
    'BTS Communication',
  ])
  expect(wrapper.find('button, a, [tabindex]').exists()).toBe(false)
})
