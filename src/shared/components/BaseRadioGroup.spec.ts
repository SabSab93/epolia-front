import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseRadioGroup from '@/shared/components/BaseRadioGroup.vue'

const options = [
  { value: 'a', label: 'Premier', description: 'Première description' },
  { value: 'b', label: 'Deuxième', disabled: true },
  { value: 'c', label: 'Troisième' },
]
enableAutoUnmount(afterEach)

describe('BaseRadioGroup', () => {
  it('starts empty and follows parent values and options without choosing a replacement', async () => {
    const wrapper = mount(BaseRadioGroup, {
      props: { legend: 'Choix', options, modelValue: undefined },
    })
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ modelValue: 'c' })
    expect(wrapper.get<HTMLInputElement>('input:checked').element.value).toBe('c')
    await wrapper.setProps({ options: options.slice(0, 2) })
    expect(wrapper.findAll('input:checked')).toHaveLength(0)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('selects once through the label, preserves a selected choice, and never submits', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseRadioGroup },
        data: () => ({ value: undefined as string | undefined, options }),
        methods: { submit },
        template:
          '<form @submit.prevent="submit"><BaseRadioGroup v-model="value" legend="Choix" :options="options" name="choice" /></form>',
      },
      { attachTo: document.body },
    )
    await wrapper.findAll('label')[0]!.trigger('click')
    expect(wrapper.vm.value).toBe('a')
    await wrapper.findAll('label')[0]!.trigger('click')
    expect(wrapper.getComponent(BaseRadioGroup).emitted('update:modelValue')).toEqual([['a']])
    await wrapper.findAll('label')[2]!.trigger('click')
    expect(wrapper.findAll('input:checked')).toHaveLength(1)
    expect(wrapper.vm.value).toBe('c')
    expect(new FormData(wrapper.get('form').element).get('choice')).toBe('c')
    expect(submit).not.toHaveBeenCalled()
  })

  it('keeps disabled options and groups inactive while preserving their value', async () => {
    const wrapper = mount(BaseRadioGroup, {
      props: { legend: 'Choix', options, modelValue: 'a' },
      attachTo: document.body,
    })
    wrapper.findAll('input')[1]!.element.click()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await wrapper.setProps({ disabled: true })
    wrapper.findAll('input')[2]!.element.click()
    expect(wrapper.get<HTMLInputElement>('input:checked').element.value).toBe('a')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    // A synthetic change must not bypass the disabled guard either.
    await wrapper.findAll('input')[2]!.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('connects labels, descriptions and error; supports required native validation', async () => {
    const wrapper = mount(BaseRadioGroup, {
      props: {
        id: 'choice',
        legend: 'Choix',
        options,
        modelValue: undefined,
        required: true,
        help: 'Aide',
        error: 'Choisissez.',
      },
      attachTo: document.body,
    })
    const input = wrapper.get('input')
    expect(wrapper.get('legend').text()).toBe('Choix*')
    expect(wrapper.get('legend span').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(
      'choice-help choice-error choice-0-description',
    )
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.element.validity.valueMissing).toBe(true)
    await wrapper.setProps({ modelValue: 'c', error: undefined, required: false })
    expect(input.element.validity.valid).toBe(true)
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBe('choice-help choice-0-description')
    expect(wrapper.find('#choice-error').exists()).toBe(false)
  })

  it('merges external descriptions on the group and choices after parent updates', async () => {
    const host = mount({
      components: { BaseRadioGroup },
      data: () => ({ description: 'external', value: undefined, options }),
      template:
        '<BaseRadioGroup v-model="value" id="choice" legend="Choix" :options="options" help="Aide" :aria-describedby="description" />',
    })
    const wrapper = host.getComponent(BaseRadioGroup)
    expect(wrapper.attributes('aria-describedby')).toBe('external choice-help')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      'external choice-help choice-0-description',
    )
    await host.setData({ description: 'updated' })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      'updated choice-help choice-0-description',
    )
  })

  it('generates independent names and ids for groups and accepts card composition', async () => {
    const wrapper = mount(
      {
        components: { BaseRadioGroup },
        data: () => ({ first: undefined, second: undefined, options }),
        template: `<div>
        <BaseRadioGroup v-model="first" legend="Premier" :options="options" option-class="card">
          <template #description="{ option }">Détail {{ option.label }}</template>
        </BaseRadioGroup>
        <BaseRadioGroup v-model="second" legend="Second" :options="options" />
      </div>`,
      },
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll('input')
    expect(new Set(inputs.map((input) => input.attributes('id'))).size).toBe(6)
    expect(inputs[0]!.attributes('name')).not.toBe(inputs[3]!.attributes('name'))
    await wrapper.findAll('label')[0]!.trigger('click')
    await wrapper.findAll('label')[5]!.trigger('click')
    expect(wrapper.findAll('input:checked')).toHaveLength(2)
    expect(wrapper.get('label').classes()).toContain('card')
    expect(wrapper.text()).toContain('Détail Premier')
  })
})
