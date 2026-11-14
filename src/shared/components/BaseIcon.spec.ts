import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IconSearch from '~icons/material-symbols/search'
import BaseIcon from '@/shared/components/BaseIcon.vue'

describe('BaseIcon', () => {
  it('renders the imported icon as an inline svg using the parent text color', () => {
    const wrapper = mount(BaseIcon, { props: { icon: IconSearch } })
    expect(wrapper.element.tagName.toLowerCase()).toBe('svg')
    expect(wrapper.find('[fill="currentColor"]').exists()).toBe(true)
  })

  it('is hidden from screen readers and never focusable when decorative', () => {
    const wrapper = mount(BaseIcon, { props: { icon: IconSearch } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    expect(wrapper.attributes('focusable')).toBe('false')
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('becomes a named image when it carries information', () => {
    const wrapper = mount(BaseIcon, { props: { icon: IconSearch, label: 'Rechercher' } })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Rechercher')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })

  it.each(['', '   '])('treats a blank label %j as decorative', (label) => {
    const wrapper = mount(BaseIcon, { props: { icon: IconSearch, label } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('uses 24 px by default and 20 px on request', async () => {
    const wrapper = mount(BaseIcon, { props: { icon: IconSearch } })
    expect(wrapper.classes()).toContain('base-icon-24')
    await wrapper.setProps({ size: 20 })
    expect(wrapper.classes()).toContain('base-icon-20')
    expect(wrapper.classes()).not.toContain('base-icon-24')
  })

  it('accepts a parent class to change its color', () => {
    const wrapper = mount(BaseIcon, {
      props: { icon: IconSearch },
      attrs: { class: 'text-epolia-primary' },
    })
    expect(wrapper.classes()).toContain('text-epolia-primary')
  })
})
