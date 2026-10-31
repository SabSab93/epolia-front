import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { reactive } from 'vue'
import meta, { LongLabel, type TagStoryArgs } from '@/shared/components/BaseTag.stories'

enableAutoUnmount(afterEach)

it('follows Controls and lets the parent remove then restore the tag', async () => {
  const args = reactive<TagStoryArgs>({ ...meta.args })
  const wrapper = mount(meta.render(args), { attachTo: document.body })
  expect(wrapper.find('button').exists()).toBe(false)
  Object.assign(args, { clearable: true, showIcon: true })
  await flushPromises()
  expect(wrapper.find('svg').exists()).toBe(true)
  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.find('.base-tag').exists()).toBe(false)
  expect(wrapper.get('[role=status]').text()).toContain('retiré')
  expect(document.activeElement).toBe(wrapper.get('button').element)
  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.find('.base-tag').exists()).toBe(true)
  expect(document.activeElement).toBe(wrapper.get('.base-tag-remove').element)
})

it('moves focus to a remaining removal button, then the entry field when the list is empty', async () => {
  const args = reactive<TagStoryArgs>({ ...meta.args, ...LongLabel.args })
  const wrapper = mount(LongLabel.render(args), { attachTo: document.body })
  await wrapper.get('.base-tag-remove').trigger('click')
  await flushPromises()
  expect(wrapper.findAll('.base-tag')).toHaveLength(2)
  expect(document.activeElement).toBe(wrapper.get('.base-tag-remove').element)
  await wrapper.get('.base-tag-remove').trigger('click')
  await flushPromises()
  await wrapper.get('.base-tag-remove').trigger('click')
  await flushPromises()
  expect(document.activeElement).toBe(wrapper.get('input').element)
  await wrapper.get('input').setValue('Illustration')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('.base-tag-label').text()).toBe('Illustration')
  expect(wrapper.get('input').element.value).toBe('')
})

it('returns focus to the previous tag when removing the last one', async () => {
  const args = reactive<TagStoryArgs>({ ...meta.args, ...LongLabel.args })
  const wrapper = mount(LongLabel.render(args), { attachTo: document.body })
  await wrapper.findAll('.base-tag-remove')[2]!.trigger('click')
  await flushPromises()
  expect(wrapper.findAll('.base-tag')).toHaveLength(2)
  expect(document.activeElement).toBe(wrapper.findAll('.base-tag-remove')[1]!.element)
})
