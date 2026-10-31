import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseSelect from '@/shared/components/BaseSelect.vue'

const options = [
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'monthly', label: 'Chaque mois' },
  { value: 'daily', label: 'Chaque jour', disabled: true },
]
enableAutoUnmount(afterEach)

async function settleReset() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

describe('BaseSelect', () => {
  it('starts empty, follows parent values and keeps the complete decorative value synchronized', async () => {
    const wrapper = mount(BaseSelect, { props: { label: 'Fréquence', options, modelValue: '' } })
    const select = wrapper.get('select')
    expect(select.element.value).toBe('')
    expect(wrapper.get('.select-value').text()).toBe('Choisir une option')
    expect(wrapper.get('.select-value').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ modelValue: 'monthly' })
    expect(select.element.value).toBe('monthly')
    expect(wrapper.get('.select-value').text()).toBe('Chaque mois')
    await wrapper.setProps({ options: options.filter((option) => option.value !== 'monthly') })
    expect(select.element.value).toBe('')
    expect(wrapper.get('.select-value').text()).toBe('Choisir une option')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('selects and clears without submitting, serializes the selected value, and honors disabled choices', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ value: '', options }),
        methods: { submit },
        template:
          '<form @submit.prevent="submit"><BaseSelect v-model="value" name="frequency" label="Fréquence" :options="options" /></form>',
      },
      { attachTo: document.body },
    )
    const select = wrapper.get('select')
    await select.setValue('weekly')
    expect(wrapper.vm.value).toBe('weekly')
    expect(wrapper.get('.select-value').text()).toBe('Chaque semaine')
    expect(new FormData(wrapper.get('form').element).get('frequency')).toBe('weekly')
    await select.setValue('daily')
    expect(wrapper.vm.value).toBe('weekly')
    await select.setValue('')
    expect(wrapper.vm.value).toBe('')
    expect(submit).not.toHaveBeenCalled()
  })

  it('preserves a disabled field model and explains empty or entirely unavailable options', async () => {
    const wrapper = mount(BaseSelect, {
      props: { label: 'Fréquence', options, modelValue: 'weekly', disabled: true },
    })
    await wrapper.get('select').setValue('monthly')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ disabled: false, options: [] })
    expect(wrapper.get('select').element.disabled).toBe(true)
    expect(wrapper.get('.select-value').text()).toBe('Aucune option disponible.')
    expect(wrapper.text()).toContain('Aucune option disponible.')
    await wrapper.setProps({
      options: [{ value: 'weekly', label: 'Chaque semaine', disabled: true }],
    })
    expect(wrapper.get('select').element.disabled).toBe(true)
    expect(wrapper.get('.select-value').text()).toBe('Chaque semaine')
    expect(wrapper.text()).toContain('Aucune option sélectionnable.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps native validity, help, error and external descriptions attached to the only control', async () => {
    const blur = vi.fn()
    const wrapper = mount(BaseSelect, {
      props: {
        id: 'frequency',
        label: 'Fréquence',
        options,
        modelValue: '',
        required: true,
        help: 'Aide',
        error: 'Choisissez.',
      },
      attrs: { 'aria-describedby': 'external', onBlur: blur, autocomplete: 'off' },
    })
    const select = wrapper.get('select')
    expect(select.element.validity.valueMissing).toBe(true)
    expect(wrapper.get('label span').attributes('aria-hidden')).toBe('true')
    expect(select.attributes('aria-describedby')).toBe('external frequency-help frequency-error')
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(select.attributes('autocomplete')).toBe('off')
    expect(wrapper.get('option').element.disabled).toBe(true)
    await select.trigger('blur')
    expect(blur).toHaveBeenCalledOnce()
    await wrapper.setProps({ modelValue: 'weekly', error: undefined })
    expect(select.element.validity.valid).toBe(true)
    expect(select.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get('.select-value').text()).toBe('Chaque semaine')
  })

  it('supports independent fields and external form association, including native and cancelled resets', async () => {
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ first: '', second: '', options }),
        template: `<div><form id="preferences"></form>
        <BaseSelect v-model="first" form="preferences" name="first" label="Premier" required :options="options" />
        <BaseSelect v-model="second" form="preferences" name="second" label="Second" :options="options" />
      </div>`,
      },
      { attachTo: document.body },
    )
    const selects = wrapper.findAll('select')
    expect(selects[0]!.attributes('id')).not.toBe(selects[1]!.attributes('id'))
    await selects[0]!.setValue('weekly')
    await selects[1]!.setValue('monthly')
    const form = wrapper.get('form').element
    expect(new FormData(form).get('first')).toBe('weekly')
    expect(new FormData(form).get('second')).toBe('monthly')
    const cancelReset = (event: Event) => event.preventDefault()
    form.addEventListener('reset', cancelReset)
    form.reset()
    await settleReset()
    expect(wrapper.vm.first).toBe('weekly')
    form.removeEventListener('reset', cancelReset)
    form.reset()
    await settleReset()
    expect(wrapper.vm.first).toBe('')
    expect(wrapper.vm.second).toBe('')
    expect(selects[0]!.element.validity.valueMissing).toBe(true)
    expect(wrapper.findAll('.select-value').map((value) => value.text())).toEqual([
      'Choisir une option',
      'Choisir une option',
    ])
  })
  it('synchronizes reset when an associated external form appears or is replaced', async () => {
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ showForm: false, value: '', options }),
        template: `<div>
        <form id="unrelated"></form>
        <form v-if="showForm" id="late-form"></form>
        <BaseSelect v-model="value" form="late-form" label="Fréquence" :options="options" />
      </div>`,
      },
      { attachTo: document.body },
    )
    const select = wrapper.get('select')
    await select.setValue('weekly')
    wrapper.get<HTMLFormElement>('#unrelated').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toBe('weekly')
    await wrapper.setData({ showForm: true })
    expect(select.element.form).toBe(wrapper.get('#late-form').element)
    wrapper.get<HTMLFormElement>('#late-form').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toBe('')
    expect(wrapper.get('.select-value').text()).toBe('Choisir une option')
    await select.setValue('monthly')
    await wrapper.setData({ showForm: false })
    await wrapper.setData({ showForm: true })
    wrapper.get<HTMLFormElement>('#late-form').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toBe('')
    expect(select.element.value).toBe('')
  })
  it('keeps reset synchronized after a rendered form is attached to the document', async () => {
    const wrapper = mount({
      components: { BaseSelect },
      data: () => ({ value: '', options }),
      template: '<form><BaseSelect v-model="value" label="Fréquence" :options="options" /></form>',
    })
    document.body.append(wrapper.element)
    await wrapper.get('select').setValue('monthly')
    wrapper.get('form').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toBe('')
    expect(wrapper.get('.select-value').text()).toBe('Choisir une option')
  })
})
