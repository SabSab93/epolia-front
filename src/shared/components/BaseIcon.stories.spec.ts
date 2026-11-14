import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import IconVerified from '~icons/material-symbols/verified'
import meta, { InheritedColor, Informative } from '@/shared/components/BaseIcon.stories'
import BaseIcon from '@/shared/components/BaseIcon.vue'

enableAutoUnmount(afterEach)

describe('BaseIcon stories', () => {
  it('offers only explicitly imported icons in Controls', () => {
    const mapping = meta.argTypes.icon.mapping
    expect(Object.keys(mapping)).toEqual(meta.argTypes.icon.options)
    expect(mapping.verified).toBe(IconVerified)
  })

  it('names the informative icon next to its visible text', () => {
    const wrapper = mount(Informative.render({ ...meta.args, ...Informative.args }))
    const icon = wrapper.getComponent(BaseIcon)
    expect(icon.attributes('role')).toBe('img')
    expect(icon.attributes('aria-label')).toBe('Profil vérifié')
    expect(wrapper.text()).toContain('Camille Martin')
  })

  it('hides the decorative icon placed before a sentence', () => {
    const wrapper = mount(InheritedColor.render({ ...meta.args, ...InheritedColor.args }))
    const icon = wrapper.getComponent(BaseIcon)
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.classes()).toContain('base-icon-20')
  })
})
