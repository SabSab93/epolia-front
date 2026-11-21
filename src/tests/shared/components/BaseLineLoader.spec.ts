import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import BaseLineLoader from '@/shared/components/BaseLineLoader.vue'

enableAutoUnmount(afterEach)

describe('BaseLineLoader', () => {
  it('renders one decorative line without text, a live region or a focus target', () => {
    const { element } = mount(BaseLineLoader, {
      attrs: { 'aria-hidden': 'false', 'aria-live': 'polite', role: 'progressbar', tabindex: '0' },
    })

    expect(element).toHaveAttribute('aria-hidden', 'true')
    expect(element).not.toHaveAttribute('role')
    expect(element).not.toHaveAttribute('aria-live')
    expect(element).not.toHaveAttribute('tabindex')
    expect(element).toBeEmptyDOMElement()
  })

  it('sets width and height independently', async () => {
    const line = mount(BaseLineLoader)
    expect(line.classes()).toEqual(expect.arrayContaining(['w-3/4', 'h-epolia-skeleton-normal']))

    await line.setProps({ width: 'xs' })
    expect(line.classes()).toEqual(expect.arrayContaining(['w-1/4', 'h-epolia-skeleton-normal']))

    await line.setProps({ height: 'thick' })
    expect(line.classes()).toEqual(expect.arrayContaining(['w-1/4', 'h-epolia-skeleton-thick']))
  })
})
