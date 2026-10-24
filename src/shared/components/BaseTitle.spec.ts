import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseTitle from '@/shared/components/BaseTitle.vue'

describe('BaseTitle', () => {
  it('renders its content as h2 by default', () => {
    const wrapper = mount(BaseTitle, { slots: { default: 'Mes informations' } })
    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toBe('Mes informations')
  })

  it('renders the requested heading level', () => {
    const wrapper = mount(BaseTitle, {
      props: { level: 'h4' },
      slots: { default: 'Mon profil' },
    })
    expect(wrapper.element.tagName).toBe('H4')
  })

  it('forwards identifiers and consumer classes to the native heading', () => {
    const wrapper = mount(BaseTitle, {
      attrs: { id: 'profile-heading', class: 'text-epolia-primary' },
      slots: { default: 'Profil' },
    })
    expect(wrapper.attributes('id')).toBe('profile-heading')
    expect(wrapper.classes()).toContain('text-epolia-primary')
    expect(wrapper.classes()).toContain('base-title')
  })
})
