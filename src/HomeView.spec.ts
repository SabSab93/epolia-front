import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import HomeView from '@/HomeView.vue'

describe('HomeView', () => {
  it('renders the technical welcome screen', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.text()).toContain('Socle mobile prêt à évoluer')
    expect(wrapper.text()).toContain('Vue Router actif')
    expect(wrapper.text()).toContain('Store disponible')
  })
})
