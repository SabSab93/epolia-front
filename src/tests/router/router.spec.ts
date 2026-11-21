import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { studentSteps } from '@/domains/onboarding/studentSteps'
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
  it('keeps a customer-only account out of the studies form', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          Response.json({
            id: 'customer',
            email: 'customer@example.test',
            emailVerified: true,
            roles: [AccountRoleEnum.Customer],
          }),
        ),
      ),
    )
    const { router } = setup()
    await router.push('/compte/etudes')
    expect(router.currentRoute.value.name).toBe('home')
  })
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
      Response.json({
        id: 'user-id',
        email: null,
        emailVerified: true,
        roles: [AccountRoleEnum.Customer],
      }),
    )
    await navigation
    expect(wrapper.text()).not.toContain('Vérification de la session')
    expect(wrapper.text()).toContain('Données privées')

    // Leave a private route in history before using the real logout action.
    await router.push('/')
    const logout = wrapper.findAll('button').find((button) => button.text() === 'Se déconnecter')!
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
    retry.resolve(
      Response.json({
        id: 'user-id',
        email: null,
        emailVerified: true,
        roles: [AccountRoleEnum.Customer],
      }),
    )
    await vi.waitFor(() => expect(wrapper.text()).toContain('Se déconnecter'))
    expect(router.currentRoute.value.name).toBe('home')
    await vi.waitFor(() => expect(document.activeElement).toBe(wrapper.get('main').element))
  })

  it.each([false, true])(
    'resumes the private destination only if still on login (left: %s)',
    async (leftLogin) => {
      vi.mocked(readAccessToken).mockResolvedValue('stored-token')
      const retry = deferred<Response>()
      const serverUser = {
        id: 'user-id',
        email: null,
        emailVerified: true,
        roles: [AccountRoleEnum.Customer],
      }
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
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          id: 'user-id',
          email: null,
          emailVerified: true,
          roles: [AccountRoleEnum.Customer],
        }),
      ),
    )
    const { pinia, router } = setup()
    await router.push('/')
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Se déconnecter'))
    const logout = wrapper.findAll('button').find((button) => button.text() === 'Se déconnecter')!
    logout.element.focus()
    await logout.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('n’a pas pu être effacé'))
    expect(wrapper.get('button').text()).toBe('Se déconnecter')
    expect(wrapper.text()).not.toContain('Vous êtes déconnecté.')
    await vi.waitFor(() => expect(document.activeElement).toBe(wrapper.get('main').element))
  })

  it('removes a mounted private view on logout and redirects without retaining it', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          id: 'user-id',
          email: null,
          emailVerified: true,
          roles: [AccountRoleEnum.Customer],
        }),
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

describe('adding a role to the current account', () => {
  it.each([
    [AccountRoleEnum.Customer, AccountRoleEnum.Student, 'étudiant'],
    [AccountRoleEnum.Student, AccountRoleEnum.Customer, 'particulier'],
  ])('opens the role-specific registration for %s', async (currentRole, newRole, label) => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    const user = { id: 'user-id', email: null, emailVerified: true, roles: [currentRole] }
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      const path = new URL(String(url)).pathname
      if (path === '/api/student-educations/me') return Response.json([])
      if (path === '/api/auth/roles') {
        user.roles = [currentRole, newRole]
        return Response.json({
          user: { ...user, status: 'ACTIVE' },
          accessToken: 'updated-token',
        })
      }
      return Response.json(user)
    })
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, router, auth } = setup()
    await router.push('/')
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
    const trigger = 'header button[aria-label="Options du compte"]'
    await vi.waitFor(() => expect(wrapper.find(trigger).exists()).toBe(true))

    await wrapper.get(trigger).trigger('click')
    const menu = document.body.querySelector('[role="dialog"][aria-label="Options du compte"]')!
    const action = Array.from(menu.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === `M’inscrire comme ${label}`,
    )
    expect(menu.textContent?.includes('Mon parcours étudiant')).toBe(
      currentRole === AccountRoleEnum.Student,
    )
    expect(menu.textContent?.includes('Refaire le parcours étudiant (dev)')).toBe(
      currentRole === AccountRoleEnum.Student,
    )
    action!.click()

    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe(`Inscription comme ${label}`))
    expect(wrapper.find('input').exists()).toBe(false)
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/auth/roles'))).toBe(
      false,
    )
    const submit = wrapper.get<HTMLButtonElement>('button[type="submit"]').element
    submit.focus()
    submit.click()

    await vi.waitFor(() =>
      expect(document.activeElement?.textContent).toBe(
        `Le rôle ${label} est actif sur votre compte.`,
      ),
    )
    expect(auth.user?.id).toBe(user.id)
    expect(auth.user?.roles).toEqual([currentRole, newRole])
    expect(writeAccessToken).toHaveBeenCalledWith('updated-token')
    const [, request] = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/api/auth/roles'),
    )!
    expect(request?.method).toBe('POST')
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer stored-token')
    expect(JSON.parse(String(request?.body))).toEqual({ role: newRole })

    const onboarding = wrapper
      .findAll('button')
      .find((item) => item.text() === 'Compléter mon profil étudiant')
    if (newRole === AccountRoleEnum.Student) {
      await onboarding!.trigger('click')
      await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe(studentSteps[0].title))
    } else {
      expect(onboarding).toBeUndefined()
    }
  })

  it('reopens onboarding and email verification from the menu for a returning dual-role student', async () => {
    vi.mocked(readAccessToken).mockResolvedValue('stored-token')
    const user = {
      id: 'dual-role',
      email: 'student@example.test',
      emailVerified: false,
      roles: [AccountRoleEnum.Student, AccountRoleEnum.Customer],
    }
    const education = {
      id: 'saved',
      source: 'MANUAL',
      school: 'École enregistrée',
      title: 'Formation enregistrée',
      level: null,
      startDate: '2025-09-01',
      endDate: null,
      catalogCampusId: null,
      catalogOfferId: null,
      studyFieldId: null,
    }
    const fetchMock = vi.fn<typeof fetch>(async (url) =>
      Response.json(
        new URL(String(url)).pathname === '/api/student-educations/me' ? [education] : user,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { pinia, router } = setup()
    await router.push('/')
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
    const trigger = 'header button[aria-label="Options du compte"]'
    await vi.waitFor(() => expect(wrapper.find(trigger).exists()).toBe(true))

    async function openMenuLink(label: string) {
      await wrapper.get(trigger).trigger('click')
      const links = document.body.querySelectorAll<HTMLAnchorElement>(
        '[role="dialog"][aria-label="Options du compte"] a',
      )
      const link = Array.from(links).find((item) => item.textContent?.trim() === label)
      expect(link).toBeDefined()
      link!.click()
    }

    await openMenuLink('Mon parcours étudiant')
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe(studentSteps[0].title))
    await router.push('/')
    await openMenuLink('Refaire le parcours étudiant (dev)')
    await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(true))
    expect(router.currentRoute.value.name).toBe('student-' + studentSteps[0].id)
    expect(wrapper.get<HTMLInputElement>('input[role="combobox"]').element.value).toBe('')
    expect(wrapper.get('[aria-current="step"]').text()).not.toContain('Terminée')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(
      true,
    )
    await router.push('/')
    await openMenuLink('Confirmer mon adresse e-mail')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('email-verification'))
  })

  it('protects a direct link to role registration', async () => {
    const { router } = setup()
    await router.push({ name: 'additional-role', params: { role: AccountRoleEnum.Student } })
    expect(router.currentRoute.value.name).toBe('login')
  })
})
