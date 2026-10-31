import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseTag from '@/shared/components/BaseTag.vue'

enableAutoUnmount(afterEach)

describe('BaseTag', () => {
  it('renders plain text without a control by default and forwards native attributes', () => {
    const wrapper = mount(BaseTag, { props: { label: 'Design' }, attrs: { id: 'design' } })
    expect(wrapper.text()).toBe('Design')
    expect(wrapper.attributes('id')).toBe('design')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('.base-tag-icon').exists()).toBe(false)
  })

  it('requests removal once without submitting the form or removing itself', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseTag },
        methods: { submit },
        template: '<form @submit.prevent="submit"><BaseTag label="Design" clearable /></form>',
      },
      { attachTo: document.body },
    )
    const tag = wrapper.getComponent(BaseTag)
    const button = tag.get('button')
    expect(button.attributes('aria-label')).toBe('Retirer Design')
    expect(button.attributes('type')).toBe('button')
    expect(button.get('span').attributes('aria-hidden')).toBe('true')
    await button.trigger('click')
    expect(tag.emitted('remove')).toEqual([[]])
    expect(tag.text()).toContain('Design')
    expect(submit).not.toHaveBeenCalled()
  })

  it('blocks removal when disabled, including programmatic click events', async () => {
    const wrapper = mount(BaseTag, { props: { label: 'Design', clearable: true, disabled: true } })
    expect(wrapper.get('button').element.disabled).toBe(true)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('remove')).toBeUndefined()
    await wrapper.setProps({ disabled: false })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    await wrapper.setProps({ clearable: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('keeps the optional icon decorative while preserving the full label and removal name', () => {
    const label = 'Conception et développement d’interfaces accessibles sur mobile'
    const wrapper = mount(BaseTag, {
      props: { label, clearable: true },
      slots: { icon: '<svg focusable="false"><path d="M1 1h2" /></svg>' },
    })
    expect(wrapper.get('.base-tag-icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.base-tag-label').text()).toBe(label)
    expect(wrapper.get('button').attributes('aria-label')).toBe(`Retirer ${label}`)
    expect(wrapper.findAll('button')).toHaveLength(1)
  })
})
