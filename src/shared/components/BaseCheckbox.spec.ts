import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseCheckbox from '@/shared/components/BaseCheckbox.vue'

enableAutoUnmount(afterEach)

describe('BaseCheckbox', () => {
  it('associates the visible label, required state and native validity', async () => {
    const wrapper = mount(BaseCheckbox, {
      props: { modelValue: false, label: 'Accepter', required: true },
    })
    const input = wrapper.get('input')
    expect(input.element.type).toBe('checkbox')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label > span:last-child > span').text()).toBe('*')
    expect(wrapper.get('label > span:last-child > span').attributes('aria-hidden')).toBe('true')
    expect(input.element.validity.valueMissing).toBe(true)
    await wrapper.setProps({ modelValue: true })
    expect(input.element.validity.valid).toBe(true)
    await wrapper.setProps({ required: false, modelValue: false })
    expect(input.element.validity.valid).toBe(true)
    expect(wrapper.text()).not.toContain('*')
  })

  it('toggles exactly once from the label or control without submitting', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseCheckbox },
        data: () => ({ accepted: false }),
        methods: { onSubmit },
        template:
          '<form @submit.prevent="onSubmit"><BaseCheckbox v-model="accepted" label="Accepter" /></form>',
      },
      { attachTo: document.body },
    )
    const checkbox = wrapper.getComponent(BaseCheckbox)
    await wrapper.get('label').trigger('click')
    expect(wrapper.vm.accepted).toBe(true)
    expect(checkbox.emitted('update:modelValue')).toEqual([[true]])
    await wrapper.get('input').trigger('click')
    expect(wrapper.vm.accepted).toBe(false)
    expect(checkbox.emitted('update:modelValue')).toEqual([[true], [false]])
    expect(onSubmit).not.toHaveBeenCalled()
    await wrapper.setData({ accepted: true })
    expect(wrapper.get('input').element.checked).toBe(true)
  })

  it.each([false, true])(
    'preserves the disabled value %s without user updates',
    async (checked) => {
      const wrapper = mount(BaseCheckbox, {
        props: { modelValue: checked, label: 'Option', disabled: true },
        attachTo: document.body,
      })
      wrapper.get('label').element.click()
      wrapper.get('input').element.click()
      expect(wrapper.get('input').element.disabled).toBe(true)
      expect(wrapper.get('input').element.checked).toBe(checked)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      await wrapper.setProps({ disabled: false })
      await wrapper.get('input').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([[!checked]])
    },
  )

  it('forwards native attributes and events while keeping help and errors associated', async () => {
    const onBlur = vi.fn()
    const wrapper = mount(BaseCheckbox, {
      props: { modelValue: true, label: 'Option', id: 'option', name: 'option', help: 'Aide' },
      attrs: { form: 'preferences', 'aria-describedby': 'external', onBlur },
    })
    const input = wrapper.get('input')
    expect(input.attributes('name')).toBe('option')
    expect(input.attributes('form')).toBe('preferences')
    expect(wrapper.attributes('form')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBe('external option-help')
    await input.trigger('blur')
    expect(onBlur).toHaveBeenCalledOnce()
    await wrapper.setProps({ error: 'Vérifiez ce choix.' })
    expect(input.attributes('aria-describedby')).toBe('external option-help option-error')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#option-error').text()).toBe('Erreur : Vérifiez ce choix.')
    expect(input.element.checked).toBe(true)
    await wrapper.setProps({ error: undefined, help: undefined })
    expect(input.attributes('aria-describedby')).toBe('external')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('keeps multiple controls, descriptions and external links independent', async () => {
    const wrapper = mount(
      {
        components: { BaseCheckbox },
        data: () => ({ accepted: false, news: false, description: 'initial' }),
        template: `<div>
        <BaseCheckbox v-model="accepted" label="Conditions" help="Première aide" :aria-describedby="description" />
        <a href="#conditions">Lire les conditions</a>
        <BaseCheckbox v-model="news" label="Nouveautés" help="Seconde aide" />
        <p id="conditions">Conditions fictives</p>
      </div>`,
      },
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll('input')
    const firstId = inputs[0]!.attributes('id')
    const secondId = inputs[1]!.attributes('id')
    expect(firstId).not.toBe(secondId)
    expect(inputs[0]!.attributes('aria-describedby')).toBe(`initial ${firstId}-help`)
    expect(inputs[1]!.attributes('aria-describedby')).toBe(`${secondId}-help`)
    await wrapper.get('a').trigger('click')
    expect(wrapper.vm.accepted).toBe(false)
    await inputs[0]!.trigger('click')
    expect(wrapper.vm.accepted).toBe(true)
    expect(wrapper.vm.news).toBe(false)
    await wrapper.setData({ description: 'updated' })
    expect(inputs[0]!.attributes('aria-describedby')).toBe(`updated ${firstId}-help`)
  })
})
