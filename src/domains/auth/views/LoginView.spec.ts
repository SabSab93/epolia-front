import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { createAppRouter } from '@/router'
import { deferred } from '@/tests/deferred'

const email = 'personne@example.test'
const password = ' exemple '

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

async function openLogin() {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory(), pinia)
  await router.push({ name: 'login' })
  const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
  await flushPromises()
  const input = (name: string) => wrapper.get<HTMLInputElement>(`input[name="${name}"]`)
  const submit = () => wrapper.get('form').trigger('submit')
  async function fillForm() {
    await input('email').setValue(email)
    await input('password').setValue(password)
  }
  return { auth: useAuthStore(pinia), wrapper, router, input, submit, fillForm }
}

it.each([AccountRoleEnum.Customer, AccountRoleEnum.Student])(
  'uses the role returned by the API and only sends one request (%s)',
  async (role) => {
    const reply = deferred<Response>()
    const request = vi.fn<typeof fetch>().mockReturnValue(reply.promise)
    vi.stubGlobal('fetch', request)
    const { auth, wrapper, router, submit, fillForm } = await openLogin()
    await fillForm()
    await submit()
    await submit()
    expect(request).toHaveBeenCalledTimes(1)
    const [url, options] = request.mock.calls[0]!
    expect(new URL(String(url)).pathname).toBe('/api/auth/login')
    expect(JSON.parse(String(options?.body))).toEqual({ email, password })
    expect(wrapper.get('button[type="submit"]').attributes('aria-busy')).toBe('true')

    reply.resolve(
      Response.json({
        user: { id: 'demo', email, roles: [role], status: 'ACTIVE' },
        accessToken: 'test-token',
      }),
    )
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
    expect(auth.user?.roles).toEqual([role])
    expect(wrapper.text()).toContain('Se déconnecter')
  },
)

it('shows both field errors and focuses the first field', async () => {
  const request = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', request)
  const { input, submit } = await openLogin()
  await submit()
  expect(input('email').attributes('aria-invalid')).toBe('true')
  expect(input('password').attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(input('email').element)
  expect(request).not.toHaveBeenCalled()
})

it('shows and hides the password without clearing it or submitting', async () => {
  const request = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', request)
  const { input, wrapper, fillForm } = await openLogin()
  await fillForm()
  const toggle = () => wrapper.get('form button[aria-label$="Mot de passe"]')
  await toggle().trigger('click')
  expect(input('password').attributes('type')).toBe('text')
  expect(input('password').element.value).toBe(password)
  await toggle().trigger('click')
  expect(input('password').attributes('type')).toBe('password')
  expect(request).not.toHaveBeenCalled()
})

it.each([
  [401, 'Adresse e-mail ou mot de passe incorrect.'],
  [403, 'La connexion à ce compte est indisponible.'],
  [null, 'Vérifiez votre connexion Internet, puis réessayez.'],
])('keeps the form available after a failed login (%s)', async (status, message) => {
  const request = vi.fn<typeof fetch>()
  if (status === null) request.mockRejectedValue(new TypeError('Network offline'))
  else request.mockResolvedValue(Response.json({}, { status }))
  vi.stubGlobal('fetch', request)
  const { auth, wrapper, router, input, submit, fillForm } = await openLogin()
  await fillForm()
  await submit()
  await flushPromises()
  expect(wrapper.text()).toContain(message)
  expect(router.currentRoute.value.name).toBe('login')
  expect(auth.isAuthenticated).toBe(false)
  expect(input('email').element.value).toBe(email)
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
})

it('preserves a departure requested while login is pending', async () => {
  const reply = deferred<Response>()
  const departure = deferred<void>()
  const guardStarted = deferred<void>()
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockReturnValue(reply.promise))
  const { auth, router, submit, fillForm } = await openLogin()
  router.beforeEach((to) => {
    if (to.name === 'choose-role') {
      guardStarted.resolve()
      return departure.promise
    }
  })

  await fillForm()
  await submit()
  const navigation = router.push({ name: 'choose-role' })
  await guardStarted.promise
  reply.resolve(
    Response.json({
      user: { id: 'demo', email, roles: [AccountRoleEnum.Customer], status: 'ACTIVE' },
      accessToken: 'test-token',
    }),
  )
  try {
    await flushPromises()
    expect(auth.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.name).toBe('login')
  } finally {
    departure.resolve()
    await navigation
  }
  expect(router.currentRoute.value.name).toBe('choose-role')
})

it('hides the session retry action while showing a login error', async () => {
  sessionStorage.setItem('epolia.access-token', 'previous-token')
  const request = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new TypeError('Network offline'))
    .mockResolvedValueOnce(Response.json({}, { status: 401 }))
  vi.stubGlobal('fetch', request)
  const { auth, wrapper, submit, fillForm } = await openLogin()

  expect(auth.status).toBe('unavailable')
  expect(wrapper.findAll('button').some((button) => button.text() === 'Réessayer')).toBe(true)
  await fillForm()
  await submit()
  await flushPromises()

  expect(wrapper.get('[role="alert"]').text()).toBe('Adresse e-mail ou mot de passe incorrect.')
  expect(wrapper.findAll('button').some((button) => button.text() === 'Réessayer')).toBe(false)
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
})
