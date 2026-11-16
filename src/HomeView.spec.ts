import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { createAppRouter } from '@/router'
import HomeView from '@/HomeView.vue'

enableAutoUnmount(afterEach)

function createTestRouter() {
  return createAppRouter(createMemoryHistory())
}

describe('HomeView', () => {
  it('renders the public welcome screen', () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia(), createTestRouter()],
      },
    })

    expect(wrapper.get('h1').text()).toBe('Epolia')
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      'S’inscrire',
      'Se connecter',
    ])
  })
})

it('navigates through the public auth screens and restores focus on return to the home page', async () => {
  const testRouter = createTestRouter()
  await testRouter.push('/')
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [createPinia(), testRouter] },
  })

  await vi.waitFor(() => expect(wrapper.get('button').text()).toBe('S’inscrire'))
  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Qui êtes-vous ?'))
  expect(document.activeElement).toBe(wrapper.get('main').element)

  const roleGroup = wrapper.get('[role="group"]')
  const roleOptions = roleGroup.findAll('button')
  expect(roleGroup.findAll('h2').map((title) => title.text())).toEqual([
    'Je suis particulier',
    'Je suis étudiant',
  ])
  expect(
    roleOptions.map(
      (option) => wrapper.get(`#${option.attributes('aria-labelledby')}`).element.tagName,
    ),
  ).toEqual(['H2', 'H2'])
  expect(
    roleOptions.map((option) => wrapper.get(`#${option.attributes('aria-describedby')}`).text()),
  ).toEqual([
    'Créez un compte pour trouver de l’aide pour une mission, par exemple des cours, un dépannage informatique ou un projet créatif.',
    'Créez un compte pour présenter votre profil et proposer des services liés à vos études.',
  ])

  const continueButton = wrapper.get('button:disabled')
  expect(continueButton.text()).toBe('Continuer')
  expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual(['false', 'false'])
  await roleOptions[0]!.trigger('click')
  await vi.waitFor(() =>
    expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
    ]),
  )
  await roleOptions[1]!.trigger('click')
  await vi.waitFor(() =>
    expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual([
      'false',
      'true',
    ]),
  )
  expect(testRouter.currentRoute.value.name).toBe('choose-role')

  expect(continueButton.attributes('disabled')).toBeUndefined()
  await continueButton.trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Créer un compte'))
  expect(testRouter.currentRoute.value.query.role).toBe(AccountRoleEnum.Student)
  expect(wrapper.text()).toContain('Compte étudiant')

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Qui êtes-vous ?'))

  expect(wrapper.get('button[aria-pressed="true"]').attributes('aria-labelledby')).toBe(
    wrapper.get('[role="group"]').findAll('h2')[1]!.attributes('id'),
  )

  await wrapper.get('a[href="/connexion"]').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Se connecter'))
  expect(wrapper.get('a').attributes('href')).toBe('/inscription/choix-du-compte')

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Epolia'))
  expect(document.activeElement).toBe(wrapper.get('main').element)
})

it('leaves an auth screen out of the back history when returning to a different destination', async () => {
  const testRouter = createTestRouter()
  await testRouter.push('/')
  await testRouter.push('/inscription/choix-du-compte')
  await testRouter.push('/connexion')
  const wrapper = mount(App, { global: { plugins: [createPinia(), testRouter] } })

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('home'))

  testRouter.back()
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('choose-role'))
})

it('keeps the return destination inside the app when registration is opened directly', async () => {
  const testRouter = createTestRouter()
  await testRouter.push({ name: 'register', query: { role: AccountRoleEnum.Customer } })
  const wrapper = mount(App, { global: { plugins: [createPinia(), testRouter] } })

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('choose-role'))
})

it.each([
  '/inscription',
  '/inscription?role=ADMIN',
  `/inscription?role=${AccountRoleEnum.Student}&role=${AccountRoleEnum.Customer}`,
])(
  'redirects an incomplete or invalid registration link (%s) to the account choice',
  async (address) => {
    const testRouter = createTestRouter()
    await testRouter.push(address)
    expect(testRouter.currentRoute.value.name).toBe('choose-role')
  },
)

it('validates a changed role while registration is already open', async () => {
  const testRouter = createTestRouter()
  await testRouter.push({ name: 'register', query: { role: AccountRoleEnum.Customer } })
  expect(testRouter.currentRoute.value.name).toBe('register')

  await testRouter.push({ name: 'register', query: { role: 'ADMIN' } })
  expect(testRouter.currentRoute.value.name).toBe('choose-role')
})

it('restores the last account choice after returning from login', async () => {
  const testRouter = createTestRouter()
  await testRouter.push('/')
  await testRouter.push({ name: 'choose-role', query: { role: AccountRoleEnum.Student } })
  const wrapper = mount(App, { global: { plugins: [createPinia(), testRouter] } })

  await wrapper.get('[role="group"] button[aria-pressed="false"]').trigger('click')
  await vi.waitFor(() =>
    expect(testRouter.currentRoute.value.query.role).toBe(AccountRoleEnum.Customer),
  )
  await wrapper.get('a[href="/connexion"]').trigger('click')
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('login'))

  testRouter.back()
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('choose-role'))
  expect(testRouter.currentRoute.value.query.role).toBe(AccountRoleEnum.Customer)
  expect(
    wrapper.findAll('[role="group"] button').map((button) => button.attributes('aria-pressed')),
  ).toEqual(['true', 'false'])

  testRouter.back()
  await vi.waitFor(() => expect(testRouter.currentRoute.value.name).toBe('home'))
})
