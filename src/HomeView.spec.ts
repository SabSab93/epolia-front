import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import router from '@/router'
import HomeView from '@/HomeView.vue'

enableAutoUnmount(afterEach)

function createTestRouter() {
  return createRouter({ history: createMemoryHistory(), routes: router.options.routes })
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
    'Décrivez votre besoin et trouvez un étudiant pour vous aider, par exemple pour des cours, un dépannage informatique ou un projet créatif.',
    'Présentez vos compétences, proposez vos services et choisissez des missions qui s’accordent avec votre emploi du temps.',
  ])

  expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual(['false', 'false'])
  await roleOptions[0]!.trigger('click')
  expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual(['true', 'false'])
  await roleOptions[1]!.trigger('click')
  expect(roleOptions.map((option) => option.attributes('aria-pressed'))).toEqual(['false', 'true'])
  expect(testRouter.currentRoute.value.name).toBe('choose-role')

  await testRouter.push('/inscription')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Créer un compte'))

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Qui êtes-vous ?'))

  await wrapper.get('a[href="/connexion"]').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Se connecter'))
  expect(wrapper.get('a').attributes('href')).toBe('/inscription/choix-du-compte')

  await wrapper.get('button').trigger('click')
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Epolia'))
  expect(document.activeElement).toBe(wrapper.get('main').element)
})
