import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { readAccessToken, writeAccessToken } from '@/domains/auth/stores/sessionStorage'
import { studentSteps } from '@/domains/onboarding/studentSteps'
import { createAppRouter } from '@/router'

vi.mock('@/domains/auth/stores/sessionStorage', () => ({
  readAccessToken: vi.fn(),
  writeAccessToken: vi.fn(),
}))

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(readAccessToken).mockResolvedValue('stored-token')
  vi.mocked(writeAccessToken).mockResolvedValue()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

type Reply = () => Response | Promise<Response>

const account =
  (emailVerified: boolean, role = AccountRoleEnum.Customer) =>
  () =>
    Response.json({
      id: 'user-id',
      email: 'camille@example.fr',
      emailVerified,
      roles: [role],
    })

const routes = {
  me: '/api/auth/me',
  send: '/api/auth/email-verification',
  verify: '/api/auth/email-verification/verify',
} as const

// A fake server: each test changes its answers before acting on the page.
function stubApi() {
  const server: Record<keyof typeof routes, Reply> = {
    me: account(false),
    send: () => Response.json({ emailVerificationSent: true }, { status: 202 }),
    // Same answer as the back: 200 with the new state.
    verify: () => Response.json({ emailVerified: true }),
  }
  const fetchMock = vi.fn<typeof fetch>(async (url) => {
    const path = new URL(String(url)).pathname
    const route = (Object.keys(routes) as (keyof typeof routes)[]).find(
      (name) => routes[name] === path,
    )
    if (path === '/api/student-educations/me') return Response.json([])
    if (!route) throw new Error(`Unexpected request: ${path}`)
    return server[route]()
  })
  vi.stubGlobal('fetch', fetchMock)
  const callsTo = (path: string) =>
    fetchMock.mock.calls.filter(([url]) => new URL(String(url)).pathname === path)
  return { server, callsTo }
}

async function openVerification(beforeMount?: (auth: ReturnType<typeof useAuthStore>) => void) {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory(), pinia)
  beforeMount?.(useAuthStore(pinia))
  await router.push({ name: 'email-verification' })
  const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })
  await flushPromises()
  const button = (label: string) =>
    wrapper.findAll('button').find((item) => item.text().startsWith(label))
  const codeInput = () => wrapper.get<HTMLInputElement>('input[name="code"]')
  return { router, wrapper, button, codeInput }
}

it('sends the six digits, then leaves once the server reports the address confirmed', async () => {
  const { server, callsTo } = stubApi()
  const { router, wrapper, button, codeInput } = await openVerification()

  expect(wrapper.text()).toContain('Saisissez le code à 6 chiffres envoyé à camille@example.fr.')
  expect(wrapper.text()).toContain('Le code est valable 10 minutes.')
  expect(button('Vérifier')!.element.disabled).toBe(true)

  await codeInput().setValue('48291')
  expect(button('Vérifier')!.element.disabled).toBe(true)
  await codeInput().setValue('482917')
  expect(button('Vérifier')!.element.disabled).toBe(false)

  server.me = account(true)
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  const [, options] = callsTo(routes.verify)[0]!
  expect(options?.method).toBe('POST')
  expect(JSON.parse(String(options?.body))).toEqual({ code: '482917' })
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer stored-token')
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
})

it('explains an incorrect code with the remaining attempts and returns to the field', async () => {
  const { server } = stubApi()
  server.verify = () =>
    Response.json(
      { code: 'EMAIL_VERIFICATION_CODE_INVALID', attemptsRemaining: 4 },
      { status: 400 },
    )
  const { wrapper, codeInput } = await openVerification()

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.text()).toContain(
    'Code incorrect. Vérifiez les chiffres saisis ou demandez un nouveau code. Il vous reste 4 essais.',
  )
  expect(codeInput().attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(codeInput().element)

  await codeInput().setValue('48291')
  expect(wrapper.text()).not.toContain('Code incorrect.')
})

it('blocks an expired code until a new one is requested', async () => {
  const { server, callsTo } = stubApi()
  server.verify = () => Response.json({ code: 'EMAIL_VERIFICATION_CODE_EXPIRED' }, { status: 410 })
  const { wrapper, button, codeInput } = await openVerification()

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.text()).toContain('Ce code a expiré : les codes ne sont valables que 10 minutes.')
  expect(codeInput().element.value).toBe('')
  expect(codeInput().element.disabled).toBe(true)
  expect(button('Vérifier')).toBeUndefined()

  await button('Recevoir un nouveau code')!.trigger('click')
  await flushPromises()

  expect(callsTo(routes.send)).toHaveLength(1)
  expect(wrapper.text()).toContain(
    'Nouveau code envoyé à camille@example.fr. Seul le dernier code reçu fonctionne.',
  )
  expect(codeInput().element.disabled).toBe(false)
  expect(document.activeElement).toBe(codeInput().element)
  expect(wrapper.text()).toContain('Renvoyer le code dans 1:00')
})

it('waits one minute after registration before offering a new code', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  stubApi()
  const { wrapper, button } = await openVerification((auth) => {
    auth.verificationEmailSent = true
  })

  expect(wrapper.text()).toContain('Nous avons envoyé un code à 6 chiffres à camille@example.fr.')
  expect(wrapper.text()).toContain('Vous n’avez rien reçu ?Renvoyer le code dans 1:00')
  expect(button('Renvoyer le code')).toBeUndefined()

  vi.advanceTimersByTime(60_000)
  await flushPromises()
  expect(button('Renvoyer le code')!.element.disabled).toBe(false)
})

it.each([
  [
    'a sending failure',
    () => Response.json({ code: 'EMAIL_SEND_FAILED' }, { status: 502 }),
    'L’envoi de l’e-mail est indisponible pour le moment. Réessayez plus tard.',
  ],
  [
    'a network error',
    () => Promise.reject(new TypeError('offline')),
    'Envoi non confirmé. Vérifiez votre connexion, puis réessayez.',
  ],
])('explains %s when asking for a new code', async (_case, reply, message) => {
  const { server } = stubApi()
  server.send = reply
  const { wrapper, button } = await openVerification()

  await button('Renvoyer le code')!.trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain(message)
  expect(button('Renvoyer le code')!.element.disabled).toBe(false)
})

it('keeps the code and explains a network error while verifying', async () => {
  const { server } = stubApi()
  server.verify = () => Promise.reject(new TypeError('offline'))
  const { router, wrapper, codeInput } = await openVerification()

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(router.currentRoute.value.name).toBe('email-verification')
  expect(wrapper.text()).toContain('Vérification non confirmée.')
  expect(codeInput().element.value).toBe('482917')
})

it('leaves the page when the address is already confirmed', async () => {
  const { server } = stubApi()
  server.me = account(true)
  const { router } = await openVerification()

  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
})

it('returns to the login page when the session has expired', async () => {
  const { server } = stubApi()
  const { router, wrapper, codeInput } = await openVerification()
  server.verify = () => Response.json({}, { status: 401 })

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
  await flushPromises()
  expect(wrapper.text()).toContain('Votre session a expiré.')
})

it('asks for a new code when the registration e-mail could not be sent', async () => {
  stubApi()
  const { wrapper, button } = await openVerification((auth) => {
    auth.verificationEmailSent = false
  })

  expect(wrapper.text()).toContain(
    'Votre compte est créé, mais le code n’a pas pu être envoyé à camille@example.fr.',
  )
  expect(button('Renvoyer le code')!.element.disabled).toBe(false)
})

it('blocks a code used up after five wrong attempts until a new one is requested', async () => {
  const { server } = stubApi()
  server.verify = () =>
    Response.json({ code: 'EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS' }, { status: 410 })
  const { wrapper, button, codeInput } = await openVerification()

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.text()).toContain(
    'Trop d’essais avec ce code. Demandez-en un nouveau pour continuer.',
  )
  expect(codeInput().element.disabled).toBe(true)
  expect(button('Recevoir un nouveau code')!.element.disabled).toBe(false)
})

it('keeps the session and explains a locked account when asking for a new code', async () => {
  const { server, callsTo } = stubApi()
  server.send = () => Response.json({ code: 'EMAIL_VERIFICATION_LOCKED' }, { status: 403 })
  const { router, wrapper, button } = await openVerification()

  await button('Renvoyer le code')!.trigger('click')
  await flushPromises()

  expect(router.currentRoute.value.name).toBe('email-verification')
  expect(wrapper.text()).toContain(
    'Trop de codes incorrects ont été saisis sur ce compte : nous ne pouvons plus vous envoyer de code.',
  )
  expect(wrapper.text()).toContain('Contactez l’équipe Epolia')
  expect(button('Renvoyer le code')).toBeUndefined()
  expect(callsTo(routes.send)).toHaveLength(1)
})

it('disables the new-code button once the account is locked', async () => {
  const { server } = stubApi()
  server.verify = () => Response.json({ code: 'EMAIL_VERIFICATION_CODE_EXPIRED' }, { status: 410 })
  server.send = () => Response.json({ code: 'EMAIL_VERIFICATION_LOCKED' }, { status: 403 })
  const { wrapper, button, codeInput } = await openVerification()

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  await button('Recevoir un nouveau code')!.trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain('Contactez l’équipe Epolia')
  expect(button('Recevoir un nouveau code')!.element.disabled).toBe(true)
})

it('starts the countdown when the server refuses a new code sent too soon', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  const { server } = stubApi()
  server.send = () => Response.json({ code: 'EMAIL_VERIFICATION_RATE_LIMITED' }, { status: 429 })
  const { wrapper, button } = await openVerification()

  await button('Renvoyer le code')!.trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain('Trop de demandes d’envoi. Réessayez plus tard.')
  expect(wrapper.text()).toContain('Renvoyer le code dans 1:00')
  expect(button('Renvoyer le code')).toBeUndefined()
})

it('shows the confirmation even when the account cannot be read again afterwards', async () => {
  const { server } = stubApi()
  const { router, wrapper, codeInput } = await openVerification()
  server.me = () => Promise.reject(new TypeError('offline'))

  await codeInput().setValue('482917')
  await wrapper.get('form').trigger('submit')
  await flushPromises()

  expect(wrapper.text()).not.toContain('Vérification non confirmée.')
  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
})

it.each([false, true])(
  'opens the shared onboarding for a student (email already verified: %s)',
  async (verified) => {
    const { server } = stubApi()
    server.me = account(verified, AccountRoleEnum.Student)
    const { router, wrapper, button } = await openVerification()
    if (!verified) await button('Compléter mon profil étudiant en attendant')!.trigger('click')
    const first = studentSteps[0]
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe(first.title))
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(document.title).toBe(first.title + ' · Epolia')
    expect(wrapper.get('[aria-current="step"]').text()).toContain(first.title)
    expect(router.currentRoute.value.meta.studentStep).toBe(first.id)
    await router.push('/compte/etudes')
    expect(router.currentRoute.value.meta.studentStep).toBe('studies')
  },
)
