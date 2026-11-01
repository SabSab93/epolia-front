import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type MultiSelectStoryArgs } from '@/shared/components/BaseMultiSelect.stories'

const useArgsMock = vi.hoisted(() => vi.fn())
vi.mock('storybook/preview-api', () => ({ useArgs: useArgsMock }))
enableAutoUnmount(afterEach)

it('keeps Controls and multiple choices synchronized without inventing an option', async () => {
  const args = reactive<MultiSelectStoryArgs>({ ...meta.args })
  const updateArgs = vi.fn((update: Partial<MultiSelectStoryArgs>) => Object.assign(args, update))
  useArgsMock.mockReturnValue([args, updateArgs])
  const wrapper = mount(meta.render(args))
  await wrapper.get('select').setValue(['design', 'web'])
  await nextTick()
  expect(updateArgs).toHaveBeenCalledExactlyOnceWith({ modelValue: ['design', 'web'] })
  expect(wrapper.findAll('.base-tag')).toHaveLength(2)
  Object.assign(args, { showHelp: true, showError: true, required: true })
  await nextTick()
  expect(wrapper.text()).toContain(args.help)
  expect(wrapper.text()).toContain(args.error)
  expect(wrapper.get('select').element.required).toBe(true)
  Object.assign(args, { empty: true })
  await nextTick()
  expect(wrapper.text()).toContain('Option indisponible')
  expect(args.modelValue).toEqual(['design', 'web'])
  expect(updateArgs).toHaveBeenCalledTimes(1)
})
