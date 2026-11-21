import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseCardButton from '@/shared/components/BaseCardButton.vue'

const props = {
  title: 'Je suis particulier',
  description: 'Je cherche un étudiant pour une mission.',
  selected: false,
}

enableAutoUnmount(afterEach)

describe('BaseCardButton', () => {
  it('links the button to its heading and description', () => {
    const wrapper = mount({
      components: { BaseCardButton },
      setup: () => ({ props }),
      template: '<div><BaseCardButton v-bind="props" /><BaseCardButton v-bind="props" /></div>',
    })
    const [firstCard, secondCard] = wrapper.findAllComponents(BaseCardButton)
    const title = firstCard!.get('h2')
    const description = firstCard!.get('p')
    const button = firstCard!.get('button')

    expect(title.text()).toBe(props.title)
    expect(description.text()).toBe(props.description)
    expect(button.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(button.attributes('aria-describedby')).toBe(description.attributes('id'))
    expect(secondCard!.get('h2').attributes('id')).not.toBe(title.attributes('id'))
  })

  it('emits one click and lets the parent control selection without submitting a form', async () => {
    const submit = vi.fn()
    const wrapper = mount(
      {
        components: { BaseCardButton },
        setup: () => ({ props, submit }),
        template: '<form @submit.prevent="submit"><BaseCardButton v-bind="props" /></form>',
      },
      { attachTo: document.body },
    )
    const card = wrapper.getComponent(BaseCardButton)
    const button = card.get('button')

    button.element.click()
    expect(card.emitted('click')).toHaveLength(1)
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(submit).not.toHaveBeenCalled()

    const selectedCard = mount(BaseCardButton, { props })
    await selectedCard.setProps({ selected: true })
    expect(selectedCard.get('button').attributes('aria-pressed')).toBe('true')
  })
})
