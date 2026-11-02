import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BaseHeader from '@/shared/components/BaseHeader.vue'
import BaseButton from '@/shared/components/BaseButton.vue'

enableAutoUnmount(afterEach)

describe('BaseHeader', () => {
  it('renders a page heading and lets the consumer choose its level and return label', async () => {
    const wrapper = mount(BaseHeader, {
      props: { title: 'Préférences' },
      attrs: { id: 'page-header' },
    })
    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.attributes('id')).toBe('page-header')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.get('h1').text()).toBe('Préférences')
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ level: 'h2', title: 'Préférences du profil', showBack: true })
    expect(wrapper.get('h2').text()).toBe('Préférences du profil')
    expect(wrapper.get('button').text()).toBe('Retour')
    await wrapper.setProps({ backLabel: 'Revenir au profil' })
    expect(wrapper.get('button').text()).toBe('Revenir au profil')
  })

  it('emits return independently from composed actions without submitting a form', async () => {
    const submit = vi.fn()
    const back = vi.fn()
    const save = vi.fn()
    const wrapper = mount(
      {
        components: { BaseHeader, BaseButton },
        setup: () => ({ submit, back, save }),
        template: `<form @submit.prevent="submit">
          <BaseHeader title="Préférences" show-back @back="back">
            <template #actions><BaseButton label="Enregistrer" @click="save" /></template>
          </BaseHeader>
        </form>`,
      },
      { attachTo: document.body },
    )
    const header = wrapper.getComponent(BaseHeader)
    const buttons = header.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['Retour', 'Enregistrer'])
    expect(buttons.every((button) => button.attributes('type') === 'button')).toBe(true)
    buttons[0]!.element.click()
    expect(header.emitted('back')).toEqual([[]])
    expect(back).toHaveBeenCalledOnce()
    expect(save).not.toHaveBeenCalled()
    buttons[1]!.element.click()
    expect(save).toHaveBeenCalledOnce()
    expect(back).toHaveBeenCalledOnce()
    expect(submit).not.toHaveBeenCalled()
  })
})
