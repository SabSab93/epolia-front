import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'

describe('BaseButton', () => {
  it('renders a native button without implicitly submitting a form', () => {
    const wrapper = mount(BaseButton, { props: { label: 'Continuer' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Continuer')
  })

  it('forwards an explicit submit type and accessibility attributes', () => {
    const wrapper = mount(BaseButton, {
      props: { label: 'Enregistrer', type: 'submit' },
      attrs: { 'aria-describedby': 'help' },
    })
    expect(wrapper.attributes('type')).toBe('submit')
    expect(wrapper.attributes('aria-describedby')).toBe('help')
  })

  it('forwards an enabled click to its consumer', async () => {
    const onClick = vi.fn()
    const wrapper = mount(BaseButton, { props: { label: 'Continuer' }, attrs: { onClick } })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each([{ disabled: true }, { loading: true }])('blocks activation when %o', async (state) => {
    const onClick = vi.fn()
    const wrapper = mount(BaseButton, {
      props: { label: 'Continuer', ...state },
      attrs: { onClick },
    })
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('keeps its label while loading and becomes available again', async () => {
    const wrapper = mount(BaseButton, { props: { label: 'Enregistrer', loading: true } })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toBe('Enregistrer')
    expect(wrapper.findComponent(BaseLoader).props('decorative')).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('disabled:opacity-50')
    await wrapper.setProps({ loading: false })
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(false)
  })
})
