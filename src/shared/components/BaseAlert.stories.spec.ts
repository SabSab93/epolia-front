import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type AlertStoryArgs } from '@/shared/components/BaseAlert.stories'

enableAutoUnmount(afterEach)

describe('BaseAlert stories', () => {
  it('demonstrates dynamic messages in an existing region without moving focus', async () => {
    const args = reactive<AlertStoryArgs>({ ...meta.args, dynamic: true, announcement: 'polite' })
    const wrapper = mount(meta.render(args), { attachTo: document.body })
    const region = wrapper.get('[role="status"]').element
    expect(wrapper.get('[role="status"]').text()).toBe('')
    const button = wrapper.get('button')
    button.element.focus()
    await button.trigger('click')
    expect(wrapper.get('[role="status"]').element).toBe(region)
    expect(wrapper.get('[role="status"]').text()).toBe(args.message)
    expect(document.activeElement).toBe(button.element)

    Object.assign(args, { message: 'Profil enregistré.', variant: 'success', showTitle: true })
    await nextTick()
    expect(wrapper.get('[role="status"]').text()).toContain('Profil enregistré.')
    expect(wrapper.get('[role="status"]').text()).toContain(args.title)
    await button.trigger('click')
    expect(wrapper.get('[role="status"]').element).toBe(region)
    expect(wrapper.get('[role="status"]').text()).toBe('')

    Object.assign(args, { dynamic: false })
    await nextTick()
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toContain('Profil enregistré.')
  })
})
