import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { type CodeInputStoryArgs } from '@/shared/components/BaseCodeInput.stories'
import * as stories from '@/shared/components/BaseCodeInput.stories'

const useArgsMock = vi.hoisted(() => vi.fn())
vi.mock('storybook/preview-api', () => ({ useArgs: useArgsMock }))
enableAutoUnmount(afterEach)

function renderStory(storyArgs: Partial<CodeInputStoryArgs> = {}) {
  const args = reactive<CodeInputStoryArgs>({ ...meta.args, ...storyArgs } as CodeInputStoryArgs)
  const updateArgs = vi.fn((update: Partial<CodeInputStoryArgs>) => Object.assign(args, update))
  useArgsMock.mockReturnValue([args, updateArgs])
  const wrapper = mount(meta.render(args), { attachTo: document.body })
  return { args, updateArgs, wrapper }
}

describe('BaseCodeInput stories', () => {
  it('keeps args and the boxes synchronized from typing and Controls', async () => {
    const { args, updateArgs, wrapper } = renderStory()

    await wrapper.get('input').setValue('48 29')
    expect(updateArgs).toHaveBeenLastCalledWith({ modelValue: '4829' })
    expect(wrapper.findAll('.base-code-cell').map((cell) => cell.text())).toEqual([
      '4',
      '8',
      '2',
      '9',
      '',
      '',
    ])

    Object.assign(args, { modelValue: '', error: 'Code incorrect.' })
    await nextTick()
    expect(wrapper.text()).toContain('Code incorrect.')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('renders each documented state', () => {
    const { wrapper: error } = renderStory(stories.WrongCode.args)
    expect(error.text()).toContain('Il vous reste 4 essais.')

    const { wrapper: disabled } = renderStory(stories.Disabled.args)
    expect(disabled.get('input').element.disabled).toBe(true)

    const { wrapper: partial } = renderStory(stories.Typing.args)
    expect(partial.findAll('.base-code-cell')[2]!.text()).toBe('2')
  })
})
