import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'

enableAutoUnmount(afterEach)

describe('BaseAlert', () => {
  it('renders an initial message without a live region, heading or interactive control', () => {
    const wrapper = mount(BaseAlert, { props: { message: 'Votre profil a été enregistré.' } })
    expect(wrapper.text()).toBe('Votre profil a été enregistré.')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    expect(wrapper.attributes('aria-atomic')).toBeUndefined()
    expect(wrapper.findAll('p')).toHaveLength(1)
    expect(wrapper.find('button, a, input, [tabindex], h1, h2, h3, h4').exists()).toBe(false)
  })

  it.each([
    ['off', undefined],
    ['polite', 'status'],
    ['assertive', 'alert'],
  ] as const)(
    'uses announcement %s independently of the visual variant',
    async (announcement, role) => {
      const wrapper = mount(BaseAlert, {
        props: { message: 'Enregistrement impossible.', variant: 'error', announcement },
      })
      expect(wrapper.attributes('role')).toBe(role)
      expect(wrapper.attributes('aria-atomic')).toBe(role ? 'true' : undefined)
      expect(wrapper.attributes('aria-live')).toBeUndefined()
      await wrapper.setProps({ variant: 'success' })
      expect(wrapper.attributes('role')).toBe(role)
      expect(wrapper.findAll('[role]')).toHaveLength(role ? 1 : 0)
    },
  )

  it('adds and removes the optional title without a heading or dangling reference', async () => {
    const wrapper = mount(BaseAlert, { props: { message: 'Réessayez dans quelques instants.' } })
    await wrapper.setProps({ title: 'Enregistrement impossible' })
    expect(wrapper.findAll('p').map((p) => p.text())).toEqual([
      'Enregistrement impossible',
      'Réessayez dans quelques instants.',
    ])
    expect(wrapper.find('h1, h2, h3, h4').exists()).toBe(false)
    await wrapper.setProps({ title: undefined })
    expect(wrapper.findAll('p')).toHaveLength(1)
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.attributes('aria-describedby')).toBeUndefined()
  })

  it('keeps the live container mounted before a message and does not rewrite it on a style change', async () => {
    const wrapper = mount(BaseAlert, {
      props: { message: '', announcement: 'polite', title: 'Profil' },
    })
    const region = wrapper.element
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toBe('')
    expect(wrapper.classes()).toHaveLength(0)

    await wrapper.setProps({ message: 'Votre profil a été enregistré.' })
    expect(wrapper.element).toBe(region)
    expect(wrapper.text()).toContain('Votre profil a été enregistré.')
    const paragraphs = wrapper.findAll('p').map((p) => p.element)
    const changes: MutationRecord[] = []
    const observer = new MutationObserver((records) => changes.push(...records))
    observer.observe(region, { childList: true, characterData: true, subtree: true })
    try {
      await wrapper.setProps({ variant: 'warning' })
      await wrapper.setProps({ message: 'Votre profil a été enregistré.' })
      expect(changes).toHaveLength(0)
      expect(wrapper.findAll('p').map((p) => p.element)).toEqual(paragraphs)
    } finally {
      observer.disconnect()
    }

    await wrapper.setProps({ message: 'Enregistrement impossible.' })
    expect(wrapper.element).toBe(region)
    expect(wrapper.text()).toContain('Enregistrement impossible.')
    await wrapper.setProps({ message: '' })
    expect(wrapper.element).toBe(region)
    expect(wrapper.text()).toBe('')
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('renders user-facing text as text and preserves line breaks in the message', () => {
    const wrapper = mount(BaseAlert, {
      props: { title: '<img src=x>', message: 'Première ligne\n<script>alert(1)</script>' },
    })
    expect(wrapper.find('img, script').exists()).toBe(false)
    expect(wrapper.findAll('p')[1]!.text()).toBe('Première ligne\n<script>alert(1)</script>')
    expect(wrapper.text()).toContain('<img src=x>')
  })

  it('keeps messages independent when several alerts are present', async () => {
    const wrapper = mount({
      components: { BaseAlert },
      data: () => ({ first: 'Profil enregistré.' }),
      template:
        '<div><BaseAlert :message="first" announcement="polite" /><BaseAlert message="Une vérification reste nécessaire." /></div>',
    })
    await wrapper.setData({ first: 'Enregistrement impossible.' })
    const alerts = wrapper.findAllComponents(BaseAlert)
    expect(alerts[0]!.text()).toBe('Enregistrement impossible.')
    expect(alerts[1]!.text()).toBe('Une vérification reste nécessaire.')
    expect(wrapper.findAll('[role="status"]')).toHaveLength(1)
    expect(wrapper.findAll('[id], [aria-labelledby], [aria-describedby]')).toHaveLength(0)
  })

  it('composes with a form without losing input, field errors or the submit focus', async () => {
    const wrapper = mount(
      defineComponent({
        components: { BaseAlert, BaseInput, BaseButton },
        data: () => ({ name: 'S', message: '', error: '' }),
        methods: {
          submit() {
            this.error = this.name.length < 2 ? 'Indiquez au moins deux caractères.' : ''
            this.message = this.error ? 'Le formulaire contient une erreur.' : 'Exemple validé.'
          },
        },
        template: `<form novalidate @submit.prevent="submit">
        <BaseInput v-model="name" id="example-name" label="Nom de l’exemple" :error="error" />
        <BaseButton type="submit" label="Vérifier l’exemple" />
        <BaseAlert :message="message" announcement="polite" />
      </form>`,
      }),
      { attachTo: document.body },
    )
    const button = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    button.element.focus()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('input').element.value).toBe('S')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('example-name-error')
    expect(wrapper.get('[role="status"]').text()).toBe('Le formulaire contient une erreur.')
    expect(document.activeElement).toBe(button.element)

    await wrapper.get('input').setValue('Sabrina')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="status"]').text()).toBe('Exemple validé.')
    expect(wrapper.get('input').element.value).toBe('Sabrina')
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined()
  })
})
