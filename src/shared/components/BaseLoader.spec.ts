import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import BaseLoader from '@/shared/components/BaseLoader.vue'

enableAutoUnmount(afterEach)

describe('BaseLoader', () => {
  it('exposes one status without a fake progress value', () => {
    const wrapper = mount(BaseLoader, { props: { label: 'Chargement des résultats.' } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-atomic')).toBe('true')
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.findAll('[role]')).toHaveLength(1)
    expect(
      wrapper.find('[aria-valuenow], [aria-valuemin], [aria-valuemax], progress').exists(),
    ).toBe(false)
    expect(wrapper.text()).toBe('Chargement des résultats.')
    expect(wrapper.find('button, a, [tabindex]').exists()).toBe(false)
  })

  it('hides the decorative spinner from assistive technology', () => {
    const wrapper = mount(BaseLoader, { props: { decorative: true } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-atomic')).toBeUndefined()
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('[role], [aria-live]').exists()).toBe(false)
  })

  it('keeps the same empty status mounted before and after loading, without taking focus', async () => {
    const wrapper = mount(
      {
        components: { BaseLoader },
        data: () => ({ loading: false }),
        template:
          '<div><button @click="loading = !loading">Basculer</button><BaseLoader :loading="loading" /></div>',
      },
      { attachTo: document.body },
    )
    const status = wrapper.get('[role="status"]').element
    const button = wrapper.get<HTMLButtonElement>('button')
    button.element.focus()
    expect(status.textContent).toBe('')
    await button.trigger('click')
    expect(wrapper.get('[role="status"]').element).toBe(status)
    expect(status.textContent).toBe('Chargement en cours.')
    expect(document.activeElement).toBe(button.element)
    await button.trigger('click')
    expect(wrapper.get('[role="status"]').element).toBe(status)
    expect(status.textContent).toBe('')
    expect(document.activeElement).toBe(button.element)
  })

  it('keeps green independently of decoration and inherits color only when requested', async () => {
    const wrapper = mount(BaseLoader)
    expect(wrapper.classes()).toContain('text-epolia-primary')
    await wrapper.setProps({ decorative: true })
    expect(wrapper.classes()).toContain('text-epolia-primary')
    await wrapper.setProps({ inheritColor: true })
    expect(wrapper.classes()).not.toContain('text-epolia-primary')
  })

  it('renders labels as text without interpreting HTML', () => {
    const wrapper = mount(BaseLoader, { props: { label: '<img src=x>' } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('<img src=x>')
  })
})
