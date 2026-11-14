import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import IconArrowForward from '~icons/material-symbols/arrow-forward'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'

describe('BaseButton', () => {
  it('renders a native button without implicitly submitting a form', () => {
    const wrapper = mount(BaseButton, { props: { label: 'Continuer' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Continuer')
    expect(wrapper.classes()).toContain('bg-epolia-primary')
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
    expect(wrapper.findComponent(BaseLoader).props('inheritColor')).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('disabled:bg-epolia-input-disabled')
    await wrapper.setProps({ loading: false })
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(false)
  })

  it.each([
    ['icon-left', 0],
    ['icon-right', 1],
  ] as const)('places a decorative icon from the %s slot around the label', (slot, index) => {
    const wrapper = mount(BaseButton, {
      props: { label: 'Continuer' },
      slots: { [slot]: () => h(BaseIcon, { icon: IconArrowForward, size: 20 }) },
    })
    const children = (wrapper.element as HTMLButtonElement).children
    const icon = wrapper.get('svg')
    expect(children).toHaveLength(2)
    expect(children[index]).toBe(icon.element)
    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.attributes('tabindex')).toBeUndefined()
    expect(wrapper.text()).toBe('Continuer')
  })

  it.each([
    ['icon-left', 0],
    ['icon-right', 1],
  ] as const)(
    'puts the spinner in place of the %s icon while loading, then restores it',
    async (slot, index) => {
      const wrapper = mount(BaseButton, {
        props: { label: 'Envoyer', loading: true },
        slots: { [slot]: () => h(BaseIcon, { icon: IconArrowForward, size: 20 }) },
      })
      const children = (wrapper.element as HTMLButtonElement).children
      expect(children).toHaveLength(2)
      expect(children[index]).toBe(wrapper.getComponent(BaseLoader).element)
      expect(wrapper.findComponent(BaseIcon).exists()).toBe(false)
      await wrapper.setProps({ loading: false })
      expect(wrapper.findComponent(BaseLoader).exists()).toBe(false)
      expect(wrapper.findComponent(BaseIcon).exists()).toBe(true)
    },
  )
})
