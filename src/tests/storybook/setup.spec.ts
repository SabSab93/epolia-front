import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import BaseCheckbox from '@/shared/components/BaseCheckbox.vue'
import { configureStorybookApp } from '@/storybook/setup'

enableAutoUnmount(afterEach)

describe('Storybook setup', () => {
  it('keeps repeated stories and their descriptions independent across Vue roots', async () => {
    const wrappers = Array.from({ length: 3 }, () =>
      mount(BaseCheckbox, {
        props: { modelValue: false, label: 'Option', help: 'Aide', error: 'Erreur' },
        attachTo: document.body,
        global: { plugins: [configureStorybookApp] },
      }),
    )
    const inputs = wrappers.map((wrapper) => wrapper.get('input').element)
    expect(new Set(inputs.map((input) => input.id)).size).toBe(3)

    for (const [index, wrapper] of wrappers.entries()) {
      const label = wrapper.get('label').element
      const input = inputs[index]!
      expect(label.control).toBe(input)
      expect(input.labels).toHaveLength(1)
      expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-help ${input.id}-error`)
      expect(wrapper.get(`#${input.id}-help`).text()).toBe('Aide')
      expect(wrapper.get(`#${input.id}-error`).text()).toBe('Erreur : Erreur')
      await wrapper.get('label').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
      for (const other of wrappers.slice(index + 1)) {
        expect(other.emitted('update:modelValue')).toBeUndefined()
      }
    }
  })
})
