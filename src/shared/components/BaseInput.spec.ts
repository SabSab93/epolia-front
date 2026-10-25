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

  it.each(['text', 'email', 'textarea'] as const)(
    'keeps the %s placeholder separate from the value, label and optional help',
    async (type) => {
      const wrapper = mount(BaseInput, {
        props: { modelValue: '', type, label: 'Votre saisie', placeholder: 'Un exemple' },
      })
      const field = type === 'textarea' ? wrapper.get('textarea') : wrapper.get('input')
      expect(field.attributes('placeholder')).toBe('Un exemple')
      expect(field.element.value).toBe('')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.get('label').attributes('for')).toBe(field.attributes('id'))
      expect(wrapper.find('p').exists()).toBe(false)
      await wrapper.setProps({ placeholder: 'Autre exemple', help: 'Une précision utile.' })
      expect(field.attributes('placeholder')).toBe('Autre exemple')
      expect(field.element.value).toBe('')
      expect(wrapper.get('p').text()).toBe('Une précision utile.')
      expect(field.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'))
      await wrapper.setProps({ placeholder: undefined, help: undefined })
      expect(field.attributes('placeholder')).toBeUndefined()
      expect(wrapper.find('p').exists()).toBe(false)
    },
  )

  it('keeps an empty date empty and forwards native birth date constraints', async () => {
    const wrapper = mount(BaseInput, {
      props: {
        modelValue: '',
        type: 'date',
        label: 'Date de naissance',
        id: 'birth-date',
        name: 'birthDate',
        autocomplete: 'bday',
        required: true,
        help: 'Renseignez votre naissance.',
      },
      attrs: { min: '1900-01-01', max: '2008-10-25' },
    })
    const input = wrapper.get('input')
    expect(input.element.type).toBe('date')
    expect(input.element.value).toBe('')
    expect(input.element.validity.valueMissing).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(input.attributes('name')).toBe('birthDate')
    expect(input.attributes('autocomplete')).toBe('bday')
    expect(wrapper.get('label').attributes('for')).toBe('birth-date')
    expect(input.attributes('aria-describedby')).toBe('birth-date-help')
    expect(input.element.min).toBe('1900-01-01')
    expect(input.element.max).toBe('2008-10-25')
    expect(wrapper.attributes('min')).toBeUndefined()
    expect(wrapper.attributes('max')).toBeUndefined()
    await input.setValue('1899-12-31')
    expect(input.element.validity.rangeUnderflow).toBe(true)
    await input.setValue('2008-10-26')
    expect(input.element.validity.rangeOverflow).toBe(true)
    await input.setValue('2008-10-25')
    expect(input.element.validity.valid).toBe(true)
  })

  it.each(['1996-02-29', '2000-01-01', '2024-03-31', '2024-10-27'])(
    'round-trips the civil date %s unchanged and preserves it after an error',
    async (date) => {
      const wrapper = mount(BaseInput, {
        props: { modelValue: '', type: 'date', label: 'Date', id: 'date' },
      })
      const input = wrapper.get('input')
      await input.setValue(date)
      expect(wrapper.emitted('update:modelValue')).toEqual([[date]])
      await wrapper.setProps({ modelValue: date, error: 'Vérifiez cette date.' })
      expect(input.element.value).toBe(date)
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('date-error')
      expect(wrapper.get('#date-error').text()).toContain('Vérifiez cette date.')
      await wrapper.setProps({ modelValue: '1980-12-31', error: undefined })
      expect(input.element.value).toBe('1980-12-31')
    },
  )

  it.each(['2023-02-29', '1900-02-29', '2024-02-30', '2024-13-01', 'invalid'])(
    'lets the native date input reject %s instead of emitting an invalid date',
    async (date) => {
      const wrapper = mount(BaseInput, {
        props: { modelValue: '2000-02-29', type: 'date', label: 'Date', required: true },
      })
      const input = wrapper.get('input')
      await input.setValue(date)
      expect(input.element.value).toBe('')
      expect(input.element.validity.valueMissing).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    },
  )

  it.each([{ disabled: true }, { readonly: true }, { clearable: false }])(
    'preserves a date without an erase action when %o',
    (state) => {
      const wrapper = mount(BaseInput, {
        props: { modelValue: '2000-02-29', type: 'date', label: 'Date', ...state },
      })
      const input = wrapper.get('input')
      expect(input.element.value).toBe('2000-02-29')
      expect(input.element.disabled).toBe('disabled' in state)
      expect(input.element.readOnly).toBe('readonly' in state)
      expect(wrapper.find('button').exists()).toBe(false)
    },
  )

  it('clears a date through v-model and returns focus without submitting', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseInput },
        data: () => ({ date: '2000-02-29' }),
        methods: { onSubmit },
        template:
          '<form @submit.prevent="onSubmit"><BaseInput v-model="date" type="date" label="Date de naissance" required /></form>',
      },
      { attachTo: globalThis.document.body },
    )
    await wrapper.get('button').trigger('click')
    const input = wrapper.get('input')
    expect(wrapper.vm.date).toBe('')
    expect(input.element.value).toBe('')
    expect(input.element.validity.valueMissing).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(globalThis.document.activeElement).toBe(input.element)
    expect(onSubmit).not.toHaveBeenCalled()
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

  it.each(['text', 'textarea'] as const)(
    'clears %s, returns focus and never submits the form',
    async (type) => {
      const onSubmit = vi.fn()
      const wrapper = mount(
        {
          components: { BaseInput },
          data: () => ({ value: 'Sabrina', type }),
          methods: { onSubmit },
          template:
            '<form @submit.prevent="onSubmit"><BaseInput v-model="value" :type="type" label="Nom" /></form>',
        },
        { attachTo: globalThis.document.body },
      )
      const button = wrapper.get('button')
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('aria-label')).toBe('Effacer le champ Nom')
      await button.trigger('click')
      const field = type === 'textarea' ? wrapper.get('textarea') : wrapper.get('input')
      expect(field.element.value).toBe('')
      expect(wrapper.find('button').exists()).toBe(false)
      expect(globalThis.document.activeElement).toBe(field.element)
      expect(onSubmit).not.toHaveBeenCalled()
    },
  )

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

  it('preserves multiline input, external updates and accessible textarea attributes', async () => {
    const wrapper = mount(BaseInput, {
      props: {
        type: 'textarea',
        modelValue: '',
        label: 'Message',
        name: 'message',
        id: 'message',
        required: true,
        help: 'Votre demande',
        error: 'Complétez le message.',
      },
      attrs: { maxlength: 500, placeholder: 'Votre message' },
    })
    const textarea = wrapper.get('textarea')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(textarea.element.rows).toBe(4)
    expect(textarea.element.required).toBe(true)
    expect(textarea.element.validity.valueMissing).toBe(true)
    expect(textarea.attributes('name')).toBe('message')
    expect(textarea.attributes('maxlength')).toBe('500')
    expect(textarea.attributes('placeholder')).toBe('Votre message')
    expect(wrapper.get('label').attributes('for')).toBe('message')
    expect(textarea.attributes('aria-describedby')).toBe('message-help message-error')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    await textarea.setValue('Bonjour,\nVoici ma demande.')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Bonjour,\nVoici ma demande.']])
    await wrapper.setProps({ modelValue: 'Autre\nmessage', rows: 6 })
    expect(textarea.element.value).toBe('Autre\nmessage')
    expect(textarea.element.rows).toBe(6)
  })

  it.each([{ disabled: true }, { readonly: true }, { clearable: false }])(
    'keeps textarea content without an erase action when %o',
    (state) => {
      const wrapper = mount(BaseInput, {
        props: {
          type: 'textarea',
          modelValue: 'Conservé\nsur deux lignes',
          label: 'Message',
          ...state,
        },
      })
      const textarea = wrapper.get('textarea')
      expect(textarea.element.value).toBe('Conservé\nsur deux lignes')
      expect(textarea.element.disabled).toBe('disabled' in state)
      expect(textarea.element.readOnly).toBe('readonly' in state)
      expect(wrapper.find('button').exists()).toBe(false)
    },
  )

  it('describes noneditable states even without a visible label', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 'Valeur conservée', ariaLabel: 'Nom', id: 'name', readonly: true },
      attrs: { 'aria-describedby': 'external-help' },
    })
    const input = wrapper.get('input')
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.get('#name-state').text()).toBe('Lecture seule.')
    expect(input.attributes('aria-describedby')).toBe('external-help name-state')
    expect(input.element.readOnly).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('#name-state').text()).toBe('Champ désactivé.')
    expect(input.element.disabled).toBe(true)
    expect(input.element.value).toBe('Valeur conservée')
    await wrapper.setProps({ readonly: false, disabled: false })
    expect(wrapper.find('#name-state').exists()).toBe(false)
    expect(input.attributes('aria-describedby')).toBe('external-help')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('keeps the model and clear focus working when the native control type changes', async () => {
    const wrapper = mount(
      {
        components: { BaseInput },
        data: () => ({ value: 'Texte conservé', type: 'text' }),
        template: '<BaseInput v-model="value" :type="type" label="Message" />',
      },
      { attachTo: globalThis.document.body },
    )
    await wrapper.setData({ type: 'textarea' })
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('textarea').element.value).toBe('Texte conservé')
    await wrapper.get('textarea').setValue('Bonjour,\nVoici ma demande.')
    expect(wrapper.vm.value).toBe('Bonjour,\nVoici ma demande.')
    await wrapper.get('button').trigger('click')
    expect(wrapper.vm.value).toBe('')
    expect(globalThis.document.activeElement).toBe(wrapper.get('textarea').element)
    await wrapper.setData({ type: 'email', value: 'demo@example.com' })
    expect(wrapper.get('input').element.type).toBe('email')
    expect(wrapper.get('input').element.value).toBe('demo@example.com')
  })

  it('refreshes external ARIA attributes without losing its internal help association', async () => {
    const wrapper = mount({
      components: { BaseInput },
      data: () => ({ description: 'initial-help', invalid: false }),
      template:
        '<BaseInput model-value="" id="name" label="Nom" help="Votre nom public" :aria-describedby="description" :aria-invalid="invalid" />',
    })
    const input = wrapper.get('input')
    expect(input.attributes('aria-describedby')).toBe('initial-help name-help')
    expect(input.attributes('aria-invalid')).toBe('false')
    await wrapper.setData({ description: 'updated-help', invalid: true })
    expect(input.attributes('aria-describedby')).toBe('updated-help name-help')
    expect(input.attributes('aria-invalid')).toBe('true')
  })
})
