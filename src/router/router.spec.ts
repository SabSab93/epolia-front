import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { createAppRouter } from '@/router'
import { deferred } from '@/tests/deferred'

vi.mock('@/domains/auth/stores/sessionStorage', () => ({
  readAccessToken: vi.fn(),
  writeAccessToken: vi.fn(),
}))

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(readAccessToken).mockResolvedValue(null)
  vi.mocked(writeAccessToken).mockResolvedValue()
})

afterEach(() => vi.unstubAllGlobals())

function setup() {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory(), pinia)
  router.addRoute({
    path: '/prive',
    component: { template: '<RouterView />' },
    meta: { requiresAuth: true },
    children: [{ path: '', component: { template: '<p>Données privées</p>' } }],
  })
  return { pinia, router, auth: useAuthStore(pinia) }
}

describe('private routes', () => {
  it('redirects a visitor without a session to login', async () => {
    const { router } = setup()
    await router.push('/prive')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('waits for server verification and rejects browser back after logout', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    const fetchReply = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(fetchReply.promise))
    const { pinia, router, auth } = setup()
    await router.push('/')
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })

    const navigation = router.push('/prive')
    expect(wrapper.text()).not.toContain('Données privées')
    expect(wrapper.get('[role="status"]').text()).toContain('Vérification de la session')
    fetchReply.resolve(Response.json({ id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }))
    await navigation
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Données privées')

    // Leave a private route in history before using the real logout action.
    await router.push('/')
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(auth.isAuthenticated).toBe(false)

    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
    expect(wrapper.text()).not.toContain('Données privées')
  })

  it('removes a mounted private view on logout and redirects without retaining it', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }),
        ),
    )
    const { pinia, router, auth } = setup()
    await router.push('/prive')
    const wrapper = mount(App, { global: { plugins: [pinia, router] } })
    expect(wrapper.text()).toContain('Données privées')

    await auth.logout()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
    expect(wrapper.text()).not.toContain('Données privées')
  })
})
