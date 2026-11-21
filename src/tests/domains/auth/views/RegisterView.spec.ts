import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { firstStudentStepDestination, studentSteps } from '@/domains/onboarding/studentSteps'
import { createAppRouter } from '@/router'
import { deferred } from '@/tests/deferred'

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

function currentUser(role: AccountRoleEnum) {
  return { id: 'id', email: 'camille@example.fr', emailVerified: false, roles: [role] }
}

async function openRegistration(role = AccountRoleEnum.Student) {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory(), pinia)
  await router.push({ name: 'register', query: { role } })
  const wrapper = mount(App, { attachTo: document.body, global: { plugins: [pinia, router] } })

  const button = (label: string) => wrapper.findAll('button').find((item) => item.text() === label)!
  const input = (name: string) => wrapper.get<HTMLInputElement>(`input[name="${name}"]`)
  const readTerms = () => button('Lire les conditions générales d’utilisation').trigger('click')
  const submit = () => wrapper.get('form').trigger('submit')
  async function fillForm() {
    await input('firstName').setValue('Camille')
    await input('lastName').setValue('Martin')
    await input('email').setValue('camille@example.fr')
    await input('birthDate').setValue('2000-01-01')
    await input('password').setValue('motdepasse')
  }
  return { router, wrapper, button, input, readTerms, submit, fillForm }
}

it('opens the terms from the checkbox and only checks it after accepting at the end', async () => {
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100)
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(400)
  const { wrapper, button, input, fillForm } = await openRegistration()
  await fillForm()

  expect(input('termsAccepted').element.checked).toBe(false)
  await input('termsAccepted').setValue(true)
  expect(button('Accepter').element.disabled).toBe(true)
  await button('Revenir au formulaire').trigger('click')
  expect(input('termsAccepted').element.checked).toBe(false)
  expect(document.activeElement).toBe(input('termsAccepted').element)
  expect(button('Créer mon compte').element.disabled).toBe(false)

  await input('termsAccepted').setValue(true)
  const region = wrapper.get('[aria-label="Texte des conditions d’utilisation"]')
  expect(region.attributes('tabindex')).toBe('0')
  expect(document.activeElement).toBe(region.element)
  const hintId = region.attributes('aria-describedby')
  expect(wrapper.get(`[id="${hintId}"]`).text()).toContain('Faites défiler')
  region.element.scrollTop = 299
  await region.trigger('scroll')
  expect(button('Accepter').element.disabled).toBe(false)
  const termsPanel = wrapper.get('[aria-labelledby="registration-terms-title"]')
  expect(termsPanel.get('[role="status"]').text()).toBe(
    'Vous pouvez maintenant accepter les conditions.',
  )
  await button('Accepter').trigger('click')

  expect(input('termsAccepted').element.checked).toBe(true)
  expect(document.activeElement).toBe(input('termsAccepted').element)
  expect(input('email').element.value).toBe('camille@example.fr')
  await input('termsAccepted').setValue(false)
  expect(button('Créer mon compte').element.disabled).toBe(false)
})

it.each([false, true])(
  'can refuse the terms and preserve the draft (previously accepted: %s)',
  async (accepted) => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const { button, input, fillForm, readTerms, submit } = await openRegistration()
    await fillForm()
    if (accepted) {
      await readTerms()
      await button('Accepter').trigger('click')
      expect(input('termsAccepted').element.checked).toBe(true)
    }

    await readTerms()
    expect(button('Refuser').element.disabled).toBe(false)
    await button('Refuser').trigger('click')

    expect(input('termsAccepted').element.checked).toBe(false)
    expect(input('email').element.value).toBe('camille@example.fr')
    expect(button('Créer mon compte').element.disabled).toBe(false)
    expect(document.activeElement).toBe(
      button('Lire les conditions générales d’utilisation').element,
    )
    await submit()
    expect(fetchMock).not.toHaveBeenCalled()
  },
)

it.each([AccountRoleEnum.Student, AccountRoleEnum.Customer])(
  'creates an account using the selected role (%s) and submits only once',
  async (role) => {
    const reply = deferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(reply.promise)
      .mockImplementation(async (url) =>
        Response.json(
          new URL(String(url)).pathname === '/api/student-educations/me' ? [] : currentUser(role),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { router, wrapper, button, fillForm, readTerms, submit } = await openRegistration(role)
    await fillForm()
    expect(button('Créer mon compte').element.disabled).toBe(false)
    await readTerms()
    expect(wrapper.text()).toContain('CGU à compléter')
    expect(fetchMock).not.toHaveBeenCalled()
    await button('Accepter').trigger('click')
    expect(document.activeElement).toBe(
      button('Lire les conditions générales d’utilisation').element,
    )

    await submit()
    await submit()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(button('Créer mon compte').attributes('aria-busy')).toBe('true')
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      role,
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.fr',
      birthDate: '2000-01-01',
      password: 'motdepasse',
      termsAccepted: true,
      termsVersion: 'cgu-test-v1',
    })

    reply.resolve(
      Response.json(
        {
          user: {
            id: 'id',
            email: 'camille@example.fr',
            emailVerified: false,
            roles: [role],
            status: 'ACTIVE',
          },
          accessToken: 'test-token',
          emailVerificationSent: true,
        },
        { status: 201 },
      ),
    )
    await flushPromises()
    if (role === AccountRoleEnum.Student) {
      await vi.waitFor(() =>
        expect(router.currentRoute.value.name).toBe(firstStudentStepDestination().name),
      )
      await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe(studentSteps[0].title))
    } else {
      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('email-verification'))
      await flushPromises()
      expect(wrapper.text()).toContain(
        'Nous avons envoyé un code à 6 chiffres à camille@example.fr.',
      )
    }
  },
)

it('preserves the draft and blocks reuse of the rejected terms version', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 'TERMS_VERSION_INVALID' }, { status: 400 }))
  vi.stubGlobal('fetch', fetchMock)
  const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
  await fillForm()
  await readTerms()
  await button('Revenir au formulaire').trigger('click')
  expect(input('email').element.value).toBe('camille@example.fr')
  expect(button('Créer mon compte').element.disabled).toBe(false)
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()
  await flushPromises()
  expect(wrapper.get('[role="alert"]').text()).toBe(
    'Les conditions ont changé. Réessayez plus tard.',
  )
  expect(input('firstName').element.value).toBe('Camille')
  expect(input('password').element.value).toBe('motdepasse')
  expect(wrapper.find('input[name="termsAccepted"]').exists()).toBe(false)
  expect(button('Créer mon compte').element.disabled).toBe(true)
  await submit()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('blocks a role change during submission and resets the form for the next role', async () => {
  const reply = deferred<Response>()
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(reply.promise)
      .mockImplementation(async () => Response.json(currentUser(AccountRoleEnum.Student))),
  )
  const { router, wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
  const customerRegistration = { name: 'register', query: { role: AccountRoleEnum.Customer } }
  await fillForm()
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()
  await router.push(customerRegistration)
  expect(router.currentRoute.value.query.role).toBe(AccountRoleEnum.Student)

  reply.resolve(
    Response.json(
      {
        user: {
          id: 'id',
          email: 'camille@example.fr',
          emailVerified: false,
          roles: [AccountRoleEnum.Student],
          status: 'ACTIVE',
        },
        accessToken: 'test-token',
      },
      { status: 201 },
    ),
  )
  await flushPromises()
  await vi.waitFor(() =>
    expect(router.currentRoute.value.name).toBe(firstStudentStepDestination().name),
  )

  await router.push(customerRegistration)
  expect(wrapper.text()).toContain('Vous êtes étudiant ?')
  expect(input('email').element.value).toBe('')
  expect(input('termsAccepted').element.checked).toBe(false)
})

it('recalculates the age limit when the UTC day changes after opening the form', async () => {
  vi.setSystemTime(new Date('2026-11-13T23:59:00Z'))
  try {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    const { button, input, readTerms, fillForm, submit } = await openRegistration()
    await fillForm()
    await input('birthDate').setValue('2008-11-14')
    await readTerms()
    await button('Accepter').trigger('click')
    await submit()
    expect(fetchMock).not.toHaveBeenCalled()

    vi.setSystemTime(new Date('2026-11-14T00:01:00Z'))
    await submit()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await flushPromises()
  } finally {
    vi.useRealTimers()
  }
})

it.each([
  ['EMAIL_ALREADY_USED', 409, 'email', 'Cet e-mail est déjà utilisé'],
  ['ADULT_REQUIRED', 403, 'birthDate', 'au moins 18 ans'],
])('focuses the field rejected by the API (%s)', async (code, status, name, message) => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code }, { status })),
  )
  const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
  await fillForm()
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()
  await flushPromises()
  expect(input(name).attributes('aria-invalid')).toBe('true')
  expect(wrapper.text()).toContain(message)
  expect(document.activeElement).toBe(input(name).element)
})

it.each(['offline', 'unexpected response'])(
  'preserves the draft when the result is unknown (%s)',
  async (kind) => {
    const request = vi.fn<typeof fetch>()
    if (kind === 'offline') request.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    else request.mockResolvedValueOnce(Response.json({ unexpected: true }, { status: 201 }))
    vi.stubGlobal('fetch', request)
    const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
    await fillForm()
    await readTerms()
    await button('Accepter').trigger('click')
    await submit()
    await flushPromises()
    expect(wrapper.text()).toContain('Création du compte non confirmée')
    expect(wrapper.text()).not.toContain('Votre compte est créé')
    expect(input('email').element.value).toBe('camille@example.fr')
    expect(button('Créer mon compte').element.disabled).toBe(false)
  },
)

it.each([
  ['2008-11-14', true],
  ['2008-11-15', false],
  ['2027-01-01', false],
  ['2001-02-29', false],
  ['', false],
])('checks the exact age boundary and invalid dates (%s)', async (date, canSubmit) => {
  vi.setSystemTime(new Date('2026-11-14T12:00:00Z'))
  try {
    const reply = deferred<Response>()
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(reply.promise)
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
    await fillForm()
    await input('birthDate').setValue(date)
    await readTerms()
    await button('Accepter').trigger('click')
    await submit()
    expect(fetchMock).toHaveBeenCalledTimes(canSubmit ? 1 : 0)
    if (date === '2008-11-15') {
      expect(wrapper.text().match(/au moins 18 ans/g)).toHaveLength(1)
      const errorId = input('birthDate').attributes('aria-describedby')
      expect(wrapper.get(`[id="${errorId}"]`).text()).toBe(
        'Erreur : Vous devez avoir au moins 18 ans.',
      )
    }
    if (canSubmit) expect(wrapper.text()).not.toContain('au moins 18 ans')
    if (canSubmit) {
      reply.resolve(Response.json({}, { status: 503 }))
      await flushPromises()
    }
  } finally {
    vi.useRealTimers()
  }
})

it('shows all required-field errors in one submission and focuses the first input', async () => {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  const { wrapper, button, input, submit } = await openRegistration()
  expect(wrapper.get('form').attributes('novalidate')).toBeDefined()
  expect(button('Créer mon compte').element.disabled).toBe(false)
  await submit()

  for (const name of ['firstName', 'lastName', 'email', 'birthDate', 'password', 'termsAccepted']) {
    expect(input(name).attributes('aria-invalid')).toBe('true')
    const errorId = input(name).attributes('aria-describedby')
    expect(wrapper.get(`[id="${errorId}"]`).text()).toContain('Erreur :')
  }
  expect(wrapper.text()).toContain('Acceptez les conditions pour continuer.')
  expect(document.activeElement).toBe(input('firstName').element)
  expect(fetchMock).not.toHaveBeenCalled()

  await input('firstName').setValue('Camille')
  expect(input('firstName').attributes('aria-invalid')).toBeUndefined()
  expect(input('lastName').attributes('aria-invalid')).toBe('true')
})

it('shows email, age and password errors together', async () => {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
  await fillForm()
  await input('email').setValue('adresse-invalide')
  await input('birthDate').setValue(new Date().toISOString().slice(0, 10))
  await input('password').setValue('123456')
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()

  expect(
    wrapper.findAll('input[aria-invalid="true"]').map((field) => field.attributes('name')),
  ).toEqual(['email', 'birthDate', 'password'])
  expect(document.activeElement).toBe(input('email').element)
  expect(wrapper.get('[role="alert"]').text()).toBe('')
  expect(fetchMock).not.toHaveBeenCalled()
})

it('rejects an invalid email before submitting', async () => {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  const { button, input, readTerms, fillForm, submit } = await openRegistration()
  await fillForm()
  await input('email').setValue('adresse-invalide')
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('shows only the field error for a short password and submits at eight characters', async () => {
  const reply = deferred<Response>()
  const fetchMock = vi.fn<typeof fetch>().mockReturnValue(reply.promise)
  vi.stubGlobal('fetch', fetchMock)
  const { wrapper, button, input, readTerms, fillForm, submit } = await openRegistration()
  await fillForm()
  await input('password').setValue('abcdefg')
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()

  const password = input('password')
  expect(fetchMock).not.toHaveBeenCalled()
  expect(password.attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(password.element)
  const errorId = password.attributes('aria-describedby')
  expect(wrapper.get(`[id="${errorId}"]`).text()).toBe(
    'Erreur : Choisissez un mot de passe d’au moins 8 caractères.',
  )
  expect(wrapper.text()).not.toContain('8 caractères minimum.')
  expect(wrapper.text()).not.toContain('Création du compte non confirmée')

  await password.setValue('abcdefgh')
  expect(password.attributes('aria-invalid')).toBeUndefined()
  await submit()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  reply.resolve(Response.json({}, { status: 503 }))
  await flushPromises()
})

it('opens the code screen after registration even if the account cannot be read again', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (url) => {
      if (new URL(String(url)).pathname === '/api/auth/me') throw new TypeError('offline')
      return Response.json(
        {
          user: { ...currentUser(AccountRoleEnum.Customer), status: 'ACTIVE' },
          accessToken: 'test-token',
          emailVerificationSent: true,
        },
        { status: 201 },
      )
    }),
  )
  const { router, wrapper, button, readTerms, fillForm, submit } = await openRegistration(
    AccountRoleEnum.Customer,
  )
  await fillForm()
  await readTerms()
  await button('Accepter').trigger('click')
  await submit()

  await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('email-verification'))
  await flushPromises()
  expect(wrapper.text()).toContain('Nous avons envoyé un code à 6 chiffres à camille@example.fr.')
})
