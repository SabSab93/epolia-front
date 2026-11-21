import { defineComponent, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ManualSchoolAddress from '@/domains/studies/components/ManualSchoolAddress.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

it('requests only address text, offers local streets and keeps free text if suggestions fail', async () => {
  const properties = {
    name: '22 rue Galilée',
    postcode: '38400',
    city: 'Saint-Martin-d’Hères',
    citycode: '38421',
    type: 'housenumber',
  }
  const request = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        features: [
          { properties: { ...properties, citycode: '44109', city: 'Nantes' } },
          { properties },
          { properties },
        ],
      }),
    )
    .mockRejectedValueOnce(new Error('offline'))
  vi.stubGlobal('fetch', request)
  const address = ref('')
  const wrapper = mount(
    defineComponent({
      components: { ManualSchoolAddress },
      setup: () => ({ address }),
      template: '<ManualSchoolAddress v-model="address" />',
    }),
    { attachTo: document.body },
  )
  const field = wrapper.get('input')
  await field.setValue('22')
  await field.setValue('22 r')
  await field.setValue('22 rue Galilée')
  await vi.waitFor(() => expect(wrapper.findAll('[role="option"]')).toHaveLength(1))
  expect(request).toHaveBeenCalledTimes(1)
  const [url, options] = request.mock.calls[0]!
  expect(new URL(url).searchParams.get('q')).toBe('22 rue Galilée')
  expect(options).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
  await wrapper.get('[role="option"]').trigger('click')
  expect(address.value).toBe('22 rue Galilée, 38400 Saint-Martin-d’Hères')
  await field.setValue('Une autre rue, 38000 Grenoble')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Suggestions indisponibles'))
  expect(address.value).toBe('Une autre rue, 38000 Grenoble')
})
