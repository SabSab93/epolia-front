import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { LongTitle, type HeaderStoryArgs } from '@/shared/components/BaseHeader.stories'

enableAutoUnmount(afterEach)

it('keeps heading, return and action states synchronized with Controls', async () => {
  const args = reactive<HeaderStoryArgs>({ ...meta.args })
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('h1').text()).toBe(args.title)
  expect(wrapper.findAll('button')).toHaveLength(1)
  Object.assign(args, { level: 'h2', showBack: true, actionDisabled: true })
  await nextTick()
  expect(wrapper.get('h2').text()).toBe(args.title)
  await wrapper.get('button').trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain(args.backLabel)
  expect(wrapper.findAll('button')[1]!.attributes('disabled')).toBeDefined()
  Object.assign(args, { actionDisabled: false, actionLoading: true })
  await nextTick()
  expect(wrapper.findAll('button')[1]!.attributes('aria-busy')).toBe('true')
  Object.assign(args, { showBack: false, showActions: false })
  await nextTick()
  expect(wrapper.find('button').exists()).toBe(false)
})

it('preserves long labels and simulates actions independently', async () => {
  const args = { ...meta.args, ...LongTitle.args }
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('h1').text()).toBe(args.title)
  expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
    args.backLabel,
    args.actionLabel,
  ])
  await wrapper.findAll('button')[1]!.trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain(args.actionLabel)
})
