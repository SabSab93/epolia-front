import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type CheckboxStoryArgs } from '@/shared/components/BaseCheckbox.stories'

const useArgsMock = vi.hoisted(() => vi.fn())
vi.mock('storybook/preview-api', () => ({ useArgs: useArgsMock }))
enableAutoUnmount(afterEach)

describe('BaseCheckbox stories', () => {
  it('keeps args and the checkbox synchronized from clicks and Controls', async () => {
    const args = reactive<CheckboxStoryArgs>({ ...meta.args })
    const updateArgs = vi.fn((update: Partial<typeof args>) => Object.assign(args, update))
    useArgsMock.mockReturnValue([args, updateArgs])
    const wrapper = mount(meta.render(args), { attachTo: document.body })
    const input = wrapper.get('input')

    await wrapper.get('label').trigger('click')
    expect(updateArgs).toHaveBeenCalledExactlyOnceWith({ modelValue: true })
    expect(args.modelValue).toBe(true)
    expect(input.element.checked).toBe(true)

    await input.trigger('click')
    expect(updateArgs).toHaveBeenLastCalledWith({ modelValue: false })
    expect(args.modelValue).toBe(false)
    expect(input.element.checked).toBe(false)

    Object.assign(args, { modelValue: true, showHelp: true, showError: true })
    await nextTick()
    expect(input.element.checked).toBe(true)
    expect(wrapper.text()).toContain(args.help)
    expect(wrapper.text()).toContain(args.error)
    expect(updateArgs).toHaveBeenCalledTimes(2)

    Object.assign(args, { modelValue: false, showHelp: false, showError: false })
    await nextTick()
    expect(input.element.checked).toBe(false)
    expect(wrapper.find('p').exists()).toBe(false)
  })
})
