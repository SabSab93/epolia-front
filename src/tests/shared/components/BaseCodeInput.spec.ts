import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import BaseCodeInput from '@/shared/components/BaseCodeInput.vue'

enableAutoUnmount(afterEach)

describe('BaseCodeInput', () => {
  it('exposes one labelled field made for one-time codes', () => {
    const wrapper = mount(BaseCodeInput, {
      props: { modelValue: '', label: 'Code de vérification' },
    })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('autocomplete')).toBe('one-time-code')
    expect(wrapper.findAll('.base-code-cell')).toHaveLength(6)
    expect(wrapper.get('.base-code-cell').element.parentElement?.getAttribute('aria-hidden')).toBe(
      'true',
    )
  })

  it('keeps only six digits from typing or pasting and shows one digit per box', async () => {
    const wrapper = mount(BaseCodeInput, {
      props: { modelValue: '', label: 'Code de vérification' },
    })
    const input = wrapper.get('input')

    await input.setValue('48a 2-9175')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['482917'])
    expect(input.element.value).toBe('482917')

    await wrapper.setProps({ modelValue: '482' })
    const cells = wrapper.findAll('.base-code-cell').map((cell) => cell.text())
    expect(cells).toEqual(['4', '8', '2', '', '', ''])
  })

  it('marks the next box while focused', async () => {
    const wrapper = mount(BaseCodeInput, {
      props: { modelValue: '48', label: 'Code de vérification' },
      attachTo: document.body,
    })
    expect(wrapper.find('.is-active').exists()).toBe(false)
    await wrapper.get('input').trigger('focus')
    expect(wrapper.findAll('.base-code-cell')[2]!.classes()).toContain('is-active')
    await wrapper.get('input').trigger('blur')
    expect(wrapper.find('.is-active').exists()).toBe(false)
  })

  it('links the help and error to the field and marks it invalid', async () => {
    const wrapper = mount(BaseCodeInput, {
      props: {
        modelValue: '',
        label: 'Code de vérification',
        help: 'Le code est valable 10 minutes.',
      },
    })
    const input = wrapper.get('input')
    expect(input.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.get(`[id="${input.attributes('aria-describedby')}"]`).text()).toBe(
      'Le code est valable 10 minutes.',
    )

    await wrapper.setProps({ error: 'Code incorrect.' })
    expect(input.attributes('aria-invalid')).toBe('true')
    const ids = input.attributes('aria-describedby')!.split(' ')
    expect(ids).toHaveLength(2)
    expect(wrapper.get(`[id="${ids[1]}"]`).text()).toBe('Code incorrect.')
    expect(wrapper.findAll('.base-code-cell.is-error')).toHaveLength(6)
  })

  it('can be disabled and focused by its parent', async () => {
    const wrapper = mount(BaseCodeInput, {
      props: { modelValue: '', label: 'Code de vérification' },
      attachTo: document.body,
    })
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(wrapper.get('input').element)

    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('input').element.disabled).toBe(true)
  })
})

describe('BaseCodeInput pasting', () => {
  it.each(['482 917', '482-917', 'Code : 482917.'])(
    'keeps all six digits of a pasted code written as "%s"',
    async (pasted) => {
      const wrapper = mount(BaseCodeInput, {
        props: { modelValue: '', label: 'Code de vérification' },
      })
      const input = wrapper.get('input')
      expect(input.attributes('maxlength')).toBeUndefined()

      await input.setValue(pasted)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['482917'])
    },
  )
})
