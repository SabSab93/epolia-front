import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SelectRoot } from 'reka-ui'
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
  it('only shows the clear button for an enabled, clearable selection', async () => {
    const wrapper = mount(BaseSelect, {
      props: { label: 'Fréquence', options, modelValue: 'weekly' },
    })
    expect(wrapper.find('button.select-clear').exists()).toBe(false)
    await wrapper.setProps({ clearable: true })
    expect(wrapper.get('button.select-clear').attributes('aria-label')).toBe(
      'Effacer la sélection : Fréquence',
    )
    expect(wrapper.get('button.select-clear').attributes('type')).toBe('button')
    expect(wrapper.get('button.select-clear').element.closest('[role=combobox]')).toBeNull()
    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('button.select-clear').exists()).toBe(false)
    await wrapper.setProps({ disabled: false, modelValue: '' })
    expect(wrapper.find('button.select-clear').exists()).toBe(false)
  })

  it('clears a required selection without submitting or opening the menu, then restores focus', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ value: 'weekly', options }),
        methods: { submit },
        template:
          '<form @submit.prevent="submit"><BaseSelect v-model="value" name="frequency" label="Fréquence" :options="options" required clearable /></form>',
      },
      { attachTo: document.body },
    )
    await wrapper.get('button.select-clear').trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toBe('')
    expect(wrapper.get('select').element.value).toBe('')
    expect(new FormData(wrapper.get('form').element).get('frequency')).toBe('')
    expect(wrapper.get('select').element.validity.valueMissing).toBe(true)
    expect(wrapper.get('[role=combobox]').attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(wrapper.get('[role=combobox]').element)
    expect(wrapper.find('button.select-clear').exists()).toBe(false)
    expect(submit).not.toHaveBeenCalled()
  })

  it('maps menu choices and clearing without exposing an internal placeholder value', async () => {
    const wrapper = mount(BaseSelect, {
      props: {
        label: 'Fréquence',
        modelValue: '',
        options: [...options, { value: '__epolia_empty__', label: 'Une vraie valeur' }],
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })
    const menu = wrapper.getComponent(SelectRoot)
    const emptyValue = (menu.vm.$props as { modelValue: string }).modelValue
    expect(emptyValue).not.toBe('__epolia_empty__')
    menu.vm.$emit('update:modelValue', '__epolia_empty__')
    await flushPromises()
    expect(wrapper.get('select').element.value).toBe('__epolia_empty__')
    expect(wrapper.get('[role=combobox]').text()).toBe('Une vraie valeur')
    menu.vm.$emit('update:modelValue', emptyValue)
    await flushPromises()
    expect(wrapper.props('modelValue')).toBe('')
    expect(wrapper.get('select').element.value).toBe('')
    menu.vm.$emit('update:modelValue', 'daily')
    await flushPromises()
    expect(wrapper.props('modelValue')).toBe('')
  })

  it('focuses the visible trigger and explains failed native validation', async () => {
    const wrapper = mount(BaseSelect, {
      attachTo: document.body,
      props: { label: 'Fréquence', options, modelValue: '', required: true },
    })
    const select = wrapper.get('select')
    expect(select.element.reportValidity()).toBe(false)
    await settleReset()
    expect(document.activeElement).toBe(wrapper.get('[role=combobox]').element)
    expect(wrapper.get('[role=combobox]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Erreur : Choisissez une option.')
    await wrapper.setProps({ required: false })
    expect(wrapper.get('[role=combobox]').attributes('aria-invalid')).toBeUndefined()
    await wrapper.setProps({ required: true })
    select.element.reportValidity()
    await flushPromises()
    await wrapper.setProps({ modelValue: 'weekly' })
    expect(select.element.validity.valid).toBe(true)
    expect(wrapper.get('[role=combobox]').attributes('aria-invalid')).toBeUndefined()
  })

  it('focuses the first invalid field when several selects fail validation', async () => {
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ first: '', second: '', options }),
        template: `<form>
        <BaseSelect id="first" v-model="first" label="Premier" :options="options" required />
        <BaseSelect id="second" v-model="second" label="Second" :options="options" required />
      </form>`,
      },
      { attachTo: document.body },
    )
    expect(wrapper.get('form').element.reportValidity()).toBe(false)
    await settleReset()
    expect(document.activeElement).toBe(wrapper.get('#first').element)
    expect(wrapper.findAll('[aria-invalid=true]')).toHaveLength(2)
  })

  it('clears a validation error on reset even when the empty model is unchanged', async () => {
    const wrapper = mount(
      {
        components: { BaseSelect },
        data: () => ({ value: '', options }),
        template:
          '<form><BaseSelect v-model="value" label="Fréquence" :options="options" required /></form>',
      },
      { attachTo: document.body },
    )
    wrapper.get('select').element.reportValidity()
    await flushPromises()
    expect(wrapper.text()).toContain('Erreur : Choisissez une option.')
    wrapper.get('form').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toBe('')
    expect(wrapper.text()).not.toContain('Erreur :')
    expect(wrapper.get('[role=combobox]').attributes('aria-invalid')).toBeUndefined()
  })

  it('starts empty, follows parent values and keeps the complete decorative value synchronized', async () => {
    const wrapper = mount(BaseSelect, { props: { label: 'Fréquence', options, modelValue: '' } })
    const select = wrapper.get('select')
    expect(select.element.value).toBe('')
    expect(wrapper.get('.select-value').text()).toBe('Choisir une option')
    expect(wrapper.get('label').attributes('for')).toBe(
      wrapper.get('[role=combobox]').attributes('id'),
    )
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
    const trigger = wrapper.get('[role=combobox]')
    expect(select.element.validity.valueMissing).toBe(true)
    expect(wrapper.get('label span').attributes('aria-hidden')).toBe('true')
    expect(trigger.attributes('aria-describedby')).toBe('external frequency-help frequency-error')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(select.attributes('autocomplete')).toBe('off')
    expect(wrapper.get('option').element.disabled).toBe(true)
    await trigger.trigger('blur')
    expect(blur).toHaveBeenCalledOnce()
    await wrapper.setProps({ modelValue: 'weekly', error: undefined })
    expect(select.element.validity.valid).toBe(true)
    expect(trigger.attributes('aria-invalid')).toBeUndefined()
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
    expect(wrapper.findAll('[role=combobox]')[0]!.attributes('id')).not.toBe(
      wrapper.findAll('[role=combobox]')[1]!.attributes('id'),
    )
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
