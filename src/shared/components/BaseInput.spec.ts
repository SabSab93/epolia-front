import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseInput from '@/shared/components/BaseInput.vue'

enableAutoUnmount(afterEach)

describe('BaseInput', () => {
  it('associates its visible label and required marker with the native input', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Nom', required: true },
    })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label span').text()).toBe('*')
    expect(wrapper.get('label span').attributes('aria-hidden')).toBe('true')
    expect(input.element.required).toBe(true)
    expect(input.element.validity.valueMissing).toBe(true)
  })

  it('emits user input and reflects external model updates', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', label: 'Nom' } })
    await wrapper.get('input').setValue('Sabrina')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Sabrina']])
    await wrapper.setProps({ modelValue: 'Autre nom' })
    expect(wrapper.get('input').element.value).toBe('Autre nom')
  })

  it('forwards native email attributes, placeholder and listeners to the input', async () => {
    const onBlur = vi.fn()
    const wrapper = mount(BaseInput, {
      props: {
        modelValue: '',
        label: 'Email',
        type: 'email',
        id: 'email',
        name: 'email',
        autocomplete: 'email',
        inputmode: 'email',
      },
      attrs: { placeholder: 'nom@exemple.fr', onBlur, form: 'profile' },
    })
    const input = wrapper.get('input')
    for (const attribute of ['type', 'id', 'name', 'autocomplete', 'inputmode']) {
      expect(input.attributes(attribute)).toBe('email')
    }
    expect(input.attributes('placeholder')).toBe('nom@exemple.fr')
    expect(input.attributes('form')).toBe('profile')
    expect(wrapper.attributes('placeholder')).toBeUndefined()
    await input.setValue('adresse-invalide')
    expect(input.element.validity.typeMismatch).toBe(true)
    await input.trigger('blur')
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it('keeps external descriptions and updates help/error associations', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 'texte', label: 'Nom', id: 'name', help: 'Votre nom public' },
      attrs: { 'aria-describedby': 'external-help' },
    })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('external-help name-help')
    await wrapper.setProps({ error: 'Saisissez un nom complet.' })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      'external-help name-help name-error',
    )
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#name-error').text()).toContain('Erreur : Saisissez un nom complet.')
    expect(wrapper.get('input').element.value).toBe('texte')
    await wrapper.setProps({ help: undefined, error: undefined })
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('external-help')
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('generates distinct identifiers for fields mounted together', () => {
    const wrapper = mount({
      components: { BaseInput },
      template:
        '<div><BaseInput model-value="" label="Nom" /><BaseInput model-value="" label="Ville" /></div>',
    })
    const inputs = wrapper.findAll('input')
    expect(inputs[0]!.attributes('id')).not.toBe(inputs[1]!.attributes('id'))
  })

  it('supports an accessible name without a visible label', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', ariaLabel: 'Rechercher une prestation', required: true },
    })
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-label')).toBe('Rechercher une prestation')
    expect(wrapper.get('input').element.required).toBe(true)
  })

  it('clears through v-model, returns focus and never submits the form', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseInput },
        data: () => ({ value: 'Sabrina' }),
        methods: { onSubmit },
        template:
          '<form @submit.prevent="onSubmit"><BaseInput v-model="value" label="Nom" /></form>',
      },
      { attachTo: globalThis.document.body },
    )
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Effacer le champ Nom')
    await button.trigger('click')
    expect(wrapper.get('input').element.value).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(globalThis.document.activeElement).toBe(wrapper.get('input').element)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each([{ disabled: true }, { readonly: true }, { clearable: false }])(
    'does not expose an erase action when %o',
    (state) => {
      const wrapper = mount(BaseInput, {
        props: { modelValue: 'Conservé', label: 'Nom', ...state },
      })
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.get('input').element.value).toBe('Conservé')
      expect(wrapper.get('input').element.disabled).toBe(Boolean('disabled' in state))
      expect(wrapper.get('input').element.readOnly).toBe(Boolean('readonly' in state))
    },
  )

  it('shows the erase action only for a nonempty value', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', label: 'Nom' } })
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ modelValue: 'Rempli' })
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
