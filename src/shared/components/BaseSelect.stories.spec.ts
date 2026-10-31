import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type SelectStoryArgs } from '@/shared/components/BaseSelect.stories'

const useArgsMock = vi.hoisted(() => vi.fn())
vi.mock('storybook/preview-api', () => ({ useArgs: useArgsMock }))
enableAutoUnmount(afterEach)

it('synchronizes native choices and Controls without selecting when the list changes', async () => {
  const args = reactive<SelectStoryArgs>({ ...meta.args })
  const updateArgs = vi.fn((update: Partial<SelectStoryArgs>) => Object.assign(args, update))
  useArgsMock.mockReturnValue([args, updateArgs])
  const wrapper = mount(meta.render(args))
  await wrapper.get('select').setValue('monthly')
  expect(updateArgs).toHaveBeenCalledExactlyOnceWith({ modelValue: 'monthly' })
  Object.assign(args, { showHelp: true, showError: true, required: true })
  await nextTick()
  expect(wrapper.text()).toContain(args.help)
  expect(wrapper.text()).toContain(args.error)
  expect(wrapper.get('select').element.required).toBe(true)
  Object.assign(args, { empty: true })
  await nextTick()
  expect(wrapper.get('select').element.disabled).toBe(true)
  expect(wrapper.text()).toContain('Aucune option disponible.')
  expect(args.modelValue).toBe('monthly')
  expect(updateArgs).toHaveBeenCalledTimes(1)
  Object.assign(args, { empty: false, modelValue: 'weekly' })
  await nextTick()
  expect(wrapper.get('select').element.value).toBe('weekly')
  expect(wrapper.get('.select-value').text()).toBe('Chaque semaine')
})
