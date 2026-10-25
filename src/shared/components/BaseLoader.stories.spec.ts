import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import meta, { InControl } from '@/shared/components/BaseLoader.stories'
import BaseLoader from '@/shared/components/BaseLoader.vue'

enableAutoUnmount(afterEach)

describe('BaseLoader stories', () => {
  it('updates the default story directly from its controls', async () => {
    const args = reactive({ ...meta.args })
    const wrapper = mount(meta.render(args))
    Object.assign(args, { variant: 'linear', label: 'Chargement du profil.' })
    await wrapper.vm.$nextTick()
    expect(wrapper.getComponent(BaseLoader).props('variant')).toBe('linear')
    expect(wrapper.text()).toBe('Chargement du profil.')
  })

  it.each(['success', 'error'] as const)(
    'simulates loading then %s without losing input or duplicating announcements',
    async (result) => {
      const wrapper = mount(InControl.render({ ...meta.args }), { attachTo: document.body })
      const region = wrapper.get('[role="status"]').element
      const input = wrapper.get('input')
      await input.setValue('Sabrina')
      expect(region.textContent).toBe('')
      await wrapper.get('form').trigger('submit')
      expect(wrapper.get('form').attributes('aria-busy')).toBe('true')
      const submit = wrapper.get<HTMLButtonElement>('button[type="submit"]')
      expect(submit.element.disabled).toBe(true)
      expect(submit.text()).toBe('Enregistrer')
      expect(submit.findComponent(BaseLoader).props('decorative')).toBe(true)
      expect(wrapper.findAll('[role="status"]')).toHaveLength(1)
      expect(region.textContent).toBe('Enregistrement en cours.')
      expect(wrapper.get('[role="status"]').element).toBe(region)
      const finish = wrapper
        .findAll<HTMLButtonElement>('button')
        .find(
          (b) => b.text() === (result === 'success' ? 'Simuler la réussite' : 'Simuler l’échec'),
        )!
      finish.element.focus()
      await finish.trigger('click')
      expect(wrapper.get('form').attributes('aria-busy')).toBeUndefined()
      expect(submit.element.disabled).toBe(false)
      expect(submit.findComponent(BaseLoader).exists()).toBe(false)
      expect(input.element.value).toBe('Sabrina')
      expect(document.activeElement).toBe(finish.element)
      expect(region.textContent).toBe(
        result === 'success' ? 'Exemple enregistré.' : 'Enregistrement impossible. Réessayez.',
      )
      expect(wrapper.get('[role="status"]').element).toBe(region)
      await wrapper.get('form').trigger('submit')
      expect(region.textContent).toBe('Enregistrement en cours.')
    },
  )
})
