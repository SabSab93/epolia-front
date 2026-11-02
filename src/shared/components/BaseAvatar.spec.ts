import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'

class ControlledImage extends EventTarget {
  static instances: ControlledImage[] = []
  src = ''
  complete = false
  naturalWidth = 0
  constructor() {
    super()
    ControlledImage.instances.push(this)
  }
}

enableAutoUnmount(afterEach)
beforeEach(() => {
  ControlledImage.instances = []
  vi.stubGlobal('Image', ControlledImage)
})
afterEach(() => vi.unstubAllGlobals())

async function settleImage(type: 'load' | 'error', image = ControlledImage.instances.at(-1)!) {
  await flushPromises()
  image.complete = true
  image.naturalWidth = type === 'load' ? 96 : 0
  image.dispatchEvent(new Event(type))
  await flushPromises()
}

describe('BaseAvatar', () => {
  it('uses a neutral fallback without deriving identity from the alternative', () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { alt: 'Pseudonyme public' },
    })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Pseudonyme public')
    expect(wrapper.text()).toBe('?')
    expect(wrapper.get('.base-avatar-fallback').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(ControlledImage.instances).toHaveLength(0)
  })

  it('keeps a decorative avatar silent and updates its contextual label', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { alt: '', initials: 'CD' },
    })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    await wrapper.setProps({ alt: 'Camille D.' })
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBe('Camille D.')
    expect(wrapper.text()).toBe('CD')
  })

  it('shows the image after loading with a single stable accessible alternative', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { src: '/profile.svg', alt: 'Profil public', initials: 'CD' },
    })
    expect(wrapper.get('.base-avatar-fallback').text()).toBe('CD')
    expect(wrapper.get('img').isVisible()).toBe(false)
    await settleImage('load')
    expect(wrapper.get('img').isVisible()).toBe(true)
    expect(wrapper.get('img').attributes('src')).toBe('/profile.svg')
    expect(wrapper.get('img').attributes('alt')).toBe('')
    expect(wrapper.get('img').attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('aria-label')).toBe('Profil public')
    expect(wrapper.find('.base-avatar-fallback').exists()).toBe(false)
  })

  it('preserves the fallback and accessible label after an invalid image', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { src: '/invalid.png', alt: 'Profil public' },
    })
    await settleImage('error')
    expect(wrapper.get('.base-avatar-fallback').text()).toBe('?')
    expect(wrapper.get('img').isVisible()).toBe(false)
    expect(wrapper.attributes('aria-label')).toBe('Profil public')
  })

  it('resets a loaded avatar on source change and ignores stale load events', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { src: '/first.svg', alt: 'Premier profil' },
    })
    const oldImage = ControlledImage.instances.at(-1)!
    await settleImage('load', oldImage)
    await wrapper.setProps({ src: '/second.svg', alt: 'Second profil', initials: 'SP' })
    expect(wrapper.get('.base-avatar-fallback').text()).toBe('SP')
    expect(wrapper.get('img').isVisible()).toBe(false)
    await settleImage('load', oldImage)
    expect(wrapper.find('.base-avatar-fallback').exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBe('Second profil')
    await settleImage('load')
    expect(wrapper.get('img').isVisible()).toBe(true)
    expect(wrapper.get('img').attributes('src')).toBe('/second.svg')
    await wrapper.setProps({ src: '   ' })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('.base-avatar-fallback').text()).toBe('SP')
  })

  it('can recover from an error with a new source', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { src: '/invalid.svg', alt: 'Profil' },
    })
    await settleImage('error')
    await wrapper.setProps({ src: '/valid.svg' })
    await settleImage('load')
    expect(wrapper.get('img').isVisible()).toBe(true)
    expect(wrapper.find('.base-avatar-fallback').exists()).toBe(false)
  })

  it('limits explicit initials to two intact graphemes and never exposes the full supplied text', async () => {
    const wrapper = mount(BaseAvatar, {
      attachTo: document.body,
      props: { alt: '', initials: '  É👩🏽‍💻long  ' },
    })
    expect(wrapper.text()).toBe('É👩🏽‍💻')
    expect(wrapper.attributes('title')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    await wrapper.setProps({ initials: '   ' })
    expect(wrapper.text()).toBe('?')
  })
})
