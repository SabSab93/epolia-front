import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type RadioStoryArgs } from '@/shared/components/BaseRadioGroup.stories'

const useArgsMock = vi.hoisted(() => vi.fn())
vi.mock('storybook/preview-api', () => ({ useArgs: useArgsMock }))
enableAutoUnmount(afterEach)

it('synchronizes radio clicks and Controls, including validation states', async () => {
  const args = reactive<RadioStoryArgs>({ ...meta.args })
  const updateArgs = vi.fn((update: Partial<RadioStoryArgs>) => Object.assign(args, update))
  useArgsMock.mockReturnValue([args, updateArgs])
  const wrapper = mount(meta.render(args), { attachTo: document.body })
  await wrapper.get('label').trigger('click')
  expect(updateArgs).toHaveBeenCalledExactlyOnceWith({ modelValue: 'email' })
  Object.assign(args, { modelValue: 'phone', showHelp: true, showError: true, required: true })
  await nextTick()
  expect(wrapper.get<HTMLInputElement>('input:checked').element.value).toBe('phone')
  expect(wrapper.text()).toContain(args.help)
  expect(wrapper.text()).toContain(args.error)
  expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  Object.assign(args, { modelValue: undefined, showHelp: false, showError: false })
  await nextTick()
  expect(wrapper.findAll('input:checked')).toHaveLength(0)
  expect(wrapper.find('p').exists()).toBe(false)
  expect(updateArgs).toHaveBeenCalledTimes(1)
})
