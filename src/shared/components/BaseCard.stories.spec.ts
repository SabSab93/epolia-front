import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, { LongContent, type CardStoryArgs } from '@/shared/components/BaseCard.stories'

enableAutoUnmount(afterEach)

it('keeps optional slots and heading level synchronized with Controls', async () => {
  const args = reactive<CardStoryArgs>({ ...meta.args })
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('h2').text()).toBe(args.heading)
  expect(wrapper.find('button').exists()).toBe(false)
  Object.assign(args, { showHeader: false, showActions: true })
  await nextTick()
  expect(wrapper.find('h2').exists()).toBe(false)
  expect(wrapper.findAll('button')).toHaveLength(2)
  await wrapper.get('button').trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain(args.primaryLabel)
  Object.assign(args, { showHeader: true, headingLevel: 'h3', showActions: false })
  await nextTick()
  expect(wrapper.get('h3').text()).toBe(args.heading)
  expect(wrapper.find('button').exists()).toBe(false)
})

it('keeps long content and both action labels intact', async () => {
  const args = { ...meta.args, ...LongContent.args }
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('p').text()).toBe(args.content)
  expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
    args.primaryLabel,
    args.secondaryLabel,
  ])
  await wrapper.findAll('button')[1]!.trigger('click')
  expect(wrapper.get('[role="status"]').text()).toContain(args.secondaryLabel)
})
