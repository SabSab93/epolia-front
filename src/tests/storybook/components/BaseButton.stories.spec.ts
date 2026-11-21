import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import meta, {
  DangerLongLabel,
  IconLoading,
  IconLongLabel,
} from '@/shared/components/stories/BaseButton.stories'
import BaseIcon from '@/shared/components/BaseIcon.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'

enableAutoUnmount(afterEach)

describe('BaseButton stories', () => {
  it('moves the icon from Controls without changing the accessible name', async () => {
    const args = reactive({ ...meta.args })
    const wrapper = mount(meta.render(args))
    expect(wrapper.findComponent(BaseIcon).exists()).toBe(false)
    Object.assign(args, { iconPosition: 'left' })
    await wrapper.vm.$nextTick()
    expect(wrapper.element.firstElementChild!.tagName.toLowerCase()).toBe('svg')
    Object.assign(args, { iconPosition: 'right' })
    await wrapper.vm.$nextTick()
    expect(wrapper.element.lastElementChild!.tagName.toLowerCase()).toBe('svg')
    expect(wrapper.text()).toBe('Continuer')
  })

  it('keeps the long label complete next to its icon', () => {
    const wrapper = mount(meta.render({ ...meta.args, ...IconLongLabel.args }))
    expect(wrapper.text()).toBe('Continuer vers la vérification de mon profil étudiant')
    expect(wrapper.findComponent(BaseIcon).props('size')).toBe(20)
  })

  it('keeps the long danger label complete', () => {
    const wrapper = mount(meta.render({ ...meta.args, ...DangerLongLabel.args }))
    expect(wrapper.text()).toBe('Supprimer définitivement mon compte et toutes mes données')
    expect(wrapper.classes()).toContain('bg-epolia-danger')
  })

  it('shows only the spinner in the loading story', () => {
    const wrapper = mount(meta.render({ ...meta.args, ...IconLoading.args }))
    expect(wrapper.findComponent(BaseLoader).exists()).toBe(true)
    expect(wrapper.findComponent(BaseIcon).exists()).toBe(false)
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
  })
})
