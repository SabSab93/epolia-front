import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
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
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })

    const navigation = router.push('/prive')
    expect(wrapper.text()).not.toContain('Données privées')
    expect(wrapper.get('[role="status"]').text()).toContain('Vérification de la session')
    fetchReply.resolve(
      Response.json({ id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }),
    )
    await navigation
    expect(wrapper.text()).not.toContain('Vérification de la session')
    expect(wrapper.text()).toContain('Données privées')

    // Leave a private route in history before using the real logout action.
    await router.push('/')
    const logout = wrapper.get('button')
    logout.element.focus()
    await logout.trigger('click')
    expect(auth.isAuthenticated).toBe(false)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Vous êtes déconnecté.'))
    expect(document.activeElement).toBe(wrapper.get('main').element)

    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
    expect(wrapper.text()).not.toContain('Données privées')
  })

  it('keeps the homepage visible during restoration and retries a network error in place', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    const verification = deferred<Response>()
    const retry = deferred<Response>()
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockReturnValueOnce(verification.promise)
        .mockReturnValueOnce(retry.promise),
    )
    const { pinia, router } = setup()
    await router.push('/')
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })

    expect(wrapper.get('h1').text()).toBe('Epolia')
    expect(wrapper.text()).toContain('Vérification de la session')
    expect(wrapper.find('button').exists()).toBe(false)
    verification.resolve(new Response(null, { status: 503 }))
    await vi.waitFor(() => expect(wrapper.get('button').text()).toBe('Réessayer'))

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true')
    retry.resolve(Response.json({ id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }))
    await vi.waitFor(() => expect(wrapper.get('button').text()).toBe('Se déconnecter'))
    expect(router.currentRoute.value.name).toBe('home')
    await vi.waitFor(() => expect(document.activeElement).toBe(wrapper.get('main').element))
  })

  it.each([false, true])(
    'resumes the private destination only if still on login (left: %s)',
    async (leftLogin) => {
      vi.mocked(readAccessToken).mockResolvedValue('stored-token')
      const retry = deferred<Response>()
      const serverUser = { id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockRejectedValueOnce(new TypeError('Network offline'))
        .mockRejectedValueOnce(new TypeError('Network offline'))
        .mockReturnValueOnce(retry.promise)
        .mockImplementation(async () => Response.json(serverUser))
      vi.stubGlobal('fetch', fetchMock)
      const { pinia, router, auth } = setup()
      await router.push('/prive?onglet=profil#infos')
      const wrapper = mount(App, { global: { plugins: [pinia, router] } })
      await vi.waitFor(() => expect(auth.isRestoring).toBe(false))
      const retryButton = wrapper.findAll('button').find((button) => button.text() === 'Réessayer')!
      await retryButton.trigger('click')
      if (leftLogin) await router.push({ name: 'choose-role' })
      retry.resolve(Response.json(serverUser))

      if (leftLogin) {
        await flushPromises()
        expect(auth.isAuthenticated).toBe(true)
        expect(router.currentRoute.value.name).toBe('choose-role')
      } else {
        await vi.waitFor(() =>
          expect(router.currentRoute.value.fullPath).toBe('/prive?onglet=profil#infos'),
        )
        expect(wrapper.text()).toContain('Données privées')
      }
    },
  )

  it('keeps logout available and restores focus when token removal fails', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    vi.mocked(writeAccessToken).mockRejectedValueOnce(new Error('Storage unavailable'))
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ id: 'user-id', email: null, roles: [AccountRoleEnum.Customer] }),
        ),
    )
    const { pinia, router } = setup()
    await router.push('/')
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
    await vi.waitFor(() => expect(wrapper.get('button').text()).toBe('Se déconnecter'))
    wrapper.get('button').element.focus()
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('n’a pas pu être effacé'))
    expect(wrapper.get('button').text()).toBe('Se déconnecter')
    expect(wrapper.text()).not.toContain('Vous êtes déconnecté.')
    await vi.waitFor(() => expect(document.activeElement).toBe(wrapper.get('main').element))
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
