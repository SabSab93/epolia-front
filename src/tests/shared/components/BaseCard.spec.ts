import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseCard from '@/shared/components/BaseCard.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

enableAutoUnmount(afterEach)

describe('BaseCard composition', () => {
  it('preserves heading semantics and delegates actions without making the card interactive', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseCard, BaseTitle, BaseButton },
        data: () => ({ confirmed: false }),
        methods: { submit },
        template: `<form @submit.prevent="submit">
        <BaseCard id="preferences">
          <template #header><BaseTitle level="h3">Préférences</BaseTitle></template>
          <p>Informations à conserver.</p>
          <template #actions><BaseButton label="Confirmer" @click="confirmed = true" /></template>
        </BaseCard>
        <output>{{ confirmed }}</output>
      </form>`,
      },
      { attachTo: document.body },
    )
    const card = wrapper.getComponent(BaseCard)
    expect(card.element.tagName).toBe('DIV')
    expect(card.attributes('tabindex')).toBeUndefined()
    expect(card.attributes('role')).toBeUndefined()
    expect(card.get('h3').text()).toBe('Préférences')
    expect(card.attributes('id')).toBe('preferences')
    await card.trigger('click')
    expect(wrapper.vm.confirmed).toBe(false)
    await wrapper.get('button').trigger('click')
    expect(wrapper.vm.confirmed).toBe(true)
    expect(card.get('p').text()).toBe('Informations à conserver.')
    expect(submit).not.toHaveBeenCalled()
  })
})
