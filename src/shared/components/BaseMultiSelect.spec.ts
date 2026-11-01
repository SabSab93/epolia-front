import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ListboxRoot } from 'reka-ui'
import BaseMultiSelect from '@/shared/components/BaseMultiSelect.vue'

// jsdom has no layout/scrolling; real popup scrolling is verified in Storybook.
const scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
beforeAll(() =>
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  }),
)
afterAll(() => {
  if (scrollDescriptor)
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollDescriptor)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
})

const options = [
  { value: 'design', label: 'Design graphique' },
  { value: 'web', label: 'Développement web' },
  { value: 'photo', label: 'Photographie', disabled: true },
]
const global = {
  stubs: {
    PopoverPortal: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
  },
}
enableAutoUnmount(afterEach)
async function settleReset() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}

describe('BaseMultiSelect', () => {
  it('starts empty without selection and follows unique controlled parent values', async () => {
    const wrapper = mount(BaseMultiSelect, {
      props: { label: 'Compétences', options, modelValue: [] },
    })
    expect(wrapper.get('select').element.selectedOptions).toHaveLength(0)
    expect(wrapper.text()).toContain('Choisir des options')
    expect(wrapper.text()).toContain('Plusieurs choix possibles')
    expect(wrapper.find('.multi-tags').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ modelValue: ['design', 'web', 'design'] })
    expect(wrapper.findAll('.base-tag')).toHaveLength(2)
    expect(wrapper.text()).toContain('2 options sélectionnées')
    expect(wrapper.props('modelValue')).toEqual(['design', 'web', 'design'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('toggles real listbox options without duplicates, submission or clearing other values', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseMultiSelect },
        data: () => ({ value: [] as string[], options }),
        methods: { submit },
        template:
          '<form @submit.prevent="submit"><BaseMultiSelect v-model="value" name="skills" label="Compétences" :options="options" /></form>',
      },
      { global, attachTo: document.body },
    )
    const items = wrapper.findAll('[role=option]')
    expect(wrapper.get('[role=listbox]').attributes('aria-multiselectable')).toBe('true')
    await items[0]!.trigger('click')
    await flushPromises()
    await items[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual(['design', 'web'])
    expect(new FormData(wrapper.get('form').element).getAll('skills')).toEqual(['design', 'web'])
    await items[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual(['web'])
    await items[2]!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual(['web'])
    expect(items[2]!.attributes('aria-disabled')).toBe('true')
    expect(submit).not.toHaveBeenCalled()
  })

  it('keeps disabled fields unchanged and prevents invalid new values from the primitive', async () => {
    const wrapper = mount(BaseMultiSelect, {
      global,
      props: { label: 'Compétences', options, modelValue: ['design'], disabled: true },
    })
    const list = wrapper.getComponent(ListboxRoot)
    list.vm.$emit('update:modelValue', ['design', 'web'])
    await flushPromises()
    await wrapper.get('.base-tag-remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('select').element.disabled).toBe(true)
    await wrapper.setProps({ disabled: false })
    list.vm.$emit('update:modelValue', ['design', 'photo'])
    list.vm.$emit('update:modelValue', ['unknown'])
    list.vm.$emit('update:modelValue', 'web')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('removes tags with next/previous focus and clears required values back to the trigger', async () => {
    const wrapper = mount(
      {
        components: { BaseMultiSelect },
        data: () => ({ value: ['design', 'web'], options, clearable: true }),
        template:
          '<form><BaseMultiSelect v-model="value" label="Compétences" :options="options" :clearable="clearable" required /></form>',
      },
      { attachTo: document.body },
    )
    await wrapper.findAll('.base-tag-remove')[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual(['design'])
    expect(document.activeElement).toBe(wrapper.get('.base-tag-remove').element)
    await wrapper.get('.base-tag-remove').trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual([])
    expect(document.activeElement).toBe(wrapper.get('.multi-trigger').element)
    expect(wrapper.get('select').element.validity.valueMissing).toBe(true)
    await wrapper.setData({ value: ['design', 'web'] })
    await wrapper.get('button[aria-haspopup]').trigger('focus')
    const clear = wrapper
      .findAll('button')
      .find((button) => button.attributes('class')?.includes('multi-clear'))!
    await clear.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual([])
    expect(document.activeElement).toBe(wrapper.get('.multi-trigger').element)
    expect(wrapper.get('[role=status]').text()).toContain('Toutes les sélections')
    await wrapper.setData({ value: ['web'] })
    await wrapper.setData({ clearable: false })
    expect(wrapper.find('.multi-clear').exists()).toBe(false)
  })

  it('separates clear from the trigger and closes the list without changing selections', async () => {
    const wrapper = mount(BaseMultiSelect, {
      global,
      attachTo: document.body,
      props: { label: 'Compétences', options, modelValue: ['design', 'web'] },
    })
    const trigger = wrapper.get('.multi-trigger')
    const clear = wrapper.get('.multi-clear')
    expect(trigger.find('button').exists()).toBe(false)
    expect(clear.attributes('aria-label')).toBe('Effacer toutes les sélections de Compétences')
    expect(wrapper.text()).not.toContain('Tout effacer')
    expect(wrapper.text()).not.toContain('Terminer')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.multi-close').exists()).toBe(false)
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.props('modelValue')).toEqual(['design', 'web'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await clear.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('restores focus only after a controlled parent applies a delayed tag removal or clear', async () => {
    const wrapper = mount(BaseMultiSelect, {
      attachTo: document.body,
      props: {
        label: 'Compétences',
        options,
        modelValue: ['design', 'web'],
        'onUpdate:modelValue': vi.fn(),
      },
    })
    const remove = wrapper.findAll('.base-tag-remove')[0]!
    ;(remove.element as HTMLButtonElement).focus()
    await remove.trigger('click')
    await flushPromises()
    expect(wrapper.props('modelValue')).toEqual(['design', 'web'])
    expect(wrapper.get('[role=status]').text()).toBe('')
    await wrapper.setProps({ modelValue: ['web'] })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.base-tag-remove').element)
    expect(wrapper.get('[role=status]').text()).toBe('Design graphique retiré.')
    const clear = wrapper
      .findAll('button')
      .find((button) => button.attributes('class')?.includes('multi-clear'))!
    ;(clear.element as HTMLButtonElement).focus()
    await clear.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toBe('')
    await wrapper.setProps({ modelValue: [] })
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.multi-trigger').element)
    expect(wrapper.get('[role=status]').text()).toContain('Toutes les sélections')
  })

  it('shows unavailable values explicitly, blocks their submission and lets the user remove them', async () => {
    const wrapper = mount({
      components: { BaseMultiSelect },
      data: () => ({ value: ['design', 'unknown', 'photo'], options }),
      template:
        '<form><BaseMultiSelect v-model="value" label="Compétences" :options="options" /></form>',
    })
    expect(wrapper.text()).toContain('Option indisponible')
    expect(wrapper.text()).toContain('Une sélection n’est plus disponible')
    expect(wrapper.get('select').element.validity.customError).toBe(true)
    await wrapper.findAll('.base-tag-remove')[1]!.trigger('click')
    await wrapper.findAll('.base-tag-remove')[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual(['design'])
    expect(wrapper.get('select').element.validity.valid).toBe(true)
    await wrapper.setData({ options: [] })
    expect(wrapper.text()).toContain('Option indisponible')
    expect(wrapper.get('select').element.validity.customError).toBe(true)
    expect(wrapper.vm.value).toEqual(['design'])
  })

  it('keeps an existing disabled choice valid and serialized while allowing its removal', async () => {
    const wrapper = mount(
      {
        components: { BaseMultiSelect },
        data: () => ({ value: ['photo'], options }),
        template:
          '<form><BaseMultiSelect v-model="value" name="skills" label="Compétences" :options="options" required /></form>',
      },
      { attachTo: document.body },
    )
    expect(wrapper.get('select').element.validity.valid).toBe(true)
    expect(new FormData(wrapper.get('form').element).getAll('skills')).toEqual(['photo'])
    expect(wrapper.text()).not.toContain('Une sélection n’est plus disponible')
    await wrapper.get('.base-tag-remove').trigger('click')
    await flushPromises()
    expect(wrapper.vm.value).toEqual([])
    expect(wrapper.get('select').element.validity.valueMissing).toBe(true)
  })

  it('names the trigger, descriptions and first invalid field without exposing the native transport', async () => {
    const wrapper = mount(BaseMultiSelect, {
      attachTo: document.body,
      props: {
        id: 'skills',
        label: 'Compétences',
        options,
        modelValue: [],
        required: true,
        help: 'Aide',
      },
      attrs: { 'aria-describedby': 'external' },
    })
    const button = wrapper.get('.multi-trigger')
    expect(button.attributes('id')).toBe('skills')
    expect(wrapper.get('label').attributes('for')).toBe('skills')
    expect(button.attributes('aria-labelledby')).toBe('skills-label skills-value')
    expect(button.attributes('aria-describedby')).toBe('external skills-hint skills-help')
    expect(wrapper.get('select').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('select').attributes('tabindex')).toBe('-1')
    expect(wrapper.get('select').element.reportValidity()).toBe(false)
    await settleReset()
    expect(document.activeElement).toBe(button.element)
    expect(button.attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Erreur : Choisissez au moins une option.')
    await wrapper.setProps({ modelValue: ['design'] })
    expect(button.attributes('aria-invalid')).toBeUndefined()
  })

  it('clears an obsolete validation error when a missing selected option is restored', async () => {
    const wrapper = mount(BaseMultiSelect, {
      attachTo: document.body,
      props: { label: 'Compétences', options: [], modelValue: ['design'], required: true },
    })
    expect(wrapper.get('select').element.reportValidity()).toBe(false)
    await settleReset()
    expect(wrapper.text()).toContain('Erreur : Retirez les options indisponibles.')
    await wrapper.setProps({ options })
    await flushPromises()
    expect(wrapper.get('select').element.validity.valid).toBe(true)
    expect(wrapper.props('modelValue')).toEqual(['design'])
    expect(wrapper.get('.multi-trigger').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Erreur :')
  })

  it('serializes external forms and handles normal, cancelled and dynamically associated resets', async () => {
    const wrapper = mount(
      {
        components: { BaseMultiSelect },
        data: () => ({ show: false, value: [] as string[], options }),
        template:
          '<div><form id="other"></form><form v-if="show" id="late"></form><BaseMultiSelect v-model="value" label="Compétences" :options="options" name="skills" form="late" required /></div>',
      },
      { attachTo: document.body },
    )
    await wrapper.setData({ value: ['design', 'web'], show: true })
    const select = wrapper.get('select')
    const form = wrapper.get<HTMLFormElement>('#late').element
    expect(Array.from(select.element.options).every((option) => !option.defaultSelected)).toBe(true)
    expect(new FormData(form).getAll('skills')).toEqual(['design', 'web'])
    wrapper.get<HTMLFormElement>('#other').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toEqual(['design', 'web'])
    const cancel = (event: Event) => event.preventDefault()
    form.addEventListener('reset', cancel)
    form.reset()
    await settleReset()
    expect(wrapper.vm.value).toEqual(['design', 'web'])
    form.removeEventListener('reset', cancel)
    form.reset()
    await settleReset()
    expect(wrapper.vm.value).toEqual([])
    expect(select.element.validity.valueMissing).toBe(true)
    await wrapper.setData({ value: ['web'], show: false })
    await wrapper.setData({ show: true })
    wrapper.get<HTMLFormElement>('#late').element.reset()
    await settleReset()
    expect(wrapper.vm.value).toEqual([])
    expect(wrapper.find('.multi-tags').exists()).toBe(false)
  })
})
