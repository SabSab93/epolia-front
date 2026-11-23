import { createPinia } from 'pinia'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentServices from '@/domains/services/views/StudentServices.vue'
import * as api from '@/domains/services/api/serviceSelectionApi'
import {
  listEducations,
  getOfferCandidates,
  getServiceCatalogue,
} from '@/domains/studies/api/studiesApi'
import { ApiError } from '@/shared/api/apiClient'
import BaseModal from '@/shared/components/BaseModal.vue'
import type { IServiceSelectionDto } from '@/domains/services/models/dtos/serviceSelection.dto'

vi.mock('@/domains/services/api/serviceSelectionApi', { spy: true })
vi.mock('@/domains/studies/api/studiesApi')
enableAutoUnmount(afterEach)
const one = { id: 'a', label: 'Montage vidéo', domainId: 'images' }
const two = { id: 'b', label: 'Création de site', domainId: 'web' }
const three = { id: 'c', label: 'Intégration web', domainId: 'web' }
const initial: IServiceSelectionDto = {
  revision: 'one',
  domainId: 'images',
  domains: [
    { id: 'images', label: 'Images' },
    { id: 'web', label: 'Web' },
  ],
  eligible: [one, two, three],
  selected: [one],
}
const education = {
  id: 'current',
  source: 'CATALOG' as const,
  title: 'BTS esthétique',
  school: 'École Terrade',
  level: null,
  startDate: '2020-01-01',
  endDate: null,
  catalogCampusId: 'campus',
  catalogOfferId: 'bts-esthetique',
  studyFieldId: null,
}
const catalogue = initial.eligible.map((item) => ({
  id: item.id,
  label: item.label,
  family: item.domainId === 'images' ? 'Images' : 'Web',
  description: '',
}))
beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  vi.mocked(listEducations).mockResolvedValue([])
  vi.mocked(getServiceCatalogue).mockResolvedValue(catalogue)
  vi.mocked(api.loadServiceSelection).mockResolvedValue(initial)
})
async function open(owner = 'student') {
  const pinia = createPinia()
  useAuthStore(pinia).user = {
    id: owner,
    roles: [AccountRoleEnum.Student],
    email: null,
    emailVerified: true,
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'student-services', component: StudentServices },
      { path: '/etudes', name: 'student-studies', component: { template: '<h1>Études</h1>' } },
    ],
  })
  await router.push('/')
  const wrapper = mount(RouterView, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return wrapper
}
it('requires confirmation before explicitly replacing a saved service with one from another domain', async () => {
  const wrapper = await open()
  await wrapper.get('input[aria-label="Montage vidéo"]').setValue(false)
  await wrapper.get('button[value="web"]').trigger('click')
  expect(wrapper.findAll('input[type=checkbox]')).toHaveLength(3)
  expect(wrapper.text()).toContain('Montage vidéo')
  await wrapper.get('input[aria-label="Création de site"]').setValue(true)
  await wrapper.get('form').trigger('submit')
  expect(wrapper.getComponent(BaseModal).props('open')).toBe(true)
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
  wrapper.getComponent(BaseModal).vm.$emit('update:open', false)
  await flushPromises()
  expect(wrapper.get('input[aria-label="Création de site"]').element).toHaveProperty(
    'checked',
    true,
  )
  vi.mocked(api.saveServiceSelection).mockResolvedValue({
    ...initial,
    revision: 'two',
    domainId: 'web',
    selected: [two],
  })
  await wrapper.get('form').trigger('submit')
  const confirm = Array.from(document.body.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Confirmer le retrait'),
  )
  expect(confirm).toBeDefined()
  confirm!.click()
  await flushPromises()
  expect(api.saveServiceSelection).toHaveBeenCalledWith('one', 'web', ['b'])
  expect(wrapper.text()).toContain('Vos choix sont enregistrés')
})
it('saves a local draft before pricing and restores it only for its owner and education', async () => {
  vi.mocked(listEducations).mockResolvedValue([education])
  vi.mocked(getOfferCandidates).mockResolvedValue([])
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    ...initial,
    domainId: null,
    revision: null,
    selected: [],
  })
  const wrapper = await open()
  await wrapper.get('button[value="web"]').trigger('click')
  await wrapper.get('input[type=checkbox]').setValue(true)
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  expect(api.saveServiceSelection).not.toHaveBeenCalled()

  const restored = await open()
  expect(restored.get('input[aria-label="Création de site"]').element).toHaveProperty(
    'checked',
    true,
  )
  const anotherStudent = await open('another-student')
  expect(anotherStudent.find('input[type=checkbox]:checked').exists()).toBe(false)
  vi.mocked(listEducations).mockResolvedValue([{ ...education, catalogOfferId: 'different-offer' }])
  const anotherOffer = await open()
  expect(anotherOffer.find('input[type=checkbox]:checked').exists()).toBe(false)
})
it('keeps Web and Organisation selections together across browsing, saving and reopening', async () => {
  const web = {
    id: 'hors-cesu-166',
    family: 'Web et projets numériques personnels',
    label: 'Migration d’un site entre hébergeurs',
    description: '',
  }
  const event = {
    id: 'hors-cesu-180',
    family: 'Organisation et événements privés',
    label: 'Aide à la prise en main d’un événement familial en visioconférence',
    description: '',
  }
  vi.mocked(listEducations).mockResolvedValue([
    {
      ...education,
      title: 'BTS SIO option A',
      school: 'Lycée polyvalent Louise Michel',
      catalogOfferId: 'bts-sio',
    },
  ])
  vi.mocked(getOfferCandidates).mockResolvedValue([web, event])
  vi.mocked(getServiceCatalogue).mockResolvedValue([
    web,
    event,
    { ...web, id: 'other', family: 'Arts' },
  ])
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    revision: 'one',
    domainId: null,
    domains: [{ id: 'web', label: web.family }],
    eligible: [{ id: web.id, domainId: 'web', label: web.label }],
    selected: [],
  })
  const webDomain = 'button[value="web"]'
  const eventDomain = 'button[value="catalogue:Organisation et événements privés"]'
  const webService = 'input[aria-label="' + web.label + '"]'
  const eventService = 'input[aria-label="' + event.label + '"]'
  const wrapper = await open()
  expect(wrapper.get('h2').text()).toBe('Vos domaines')
  expect(wrapper.get(webDomain).attributes('aria-expanded')).toBe('true')
  await wrapper.get(webService).setValue(true)
  await wrapper.get(eventDomain).trigger('click')
  expect(wrapper.get(webDomain).attributes('aria-expanded')).toBe('true')
  expect(wrapper.get(eventDomain).attributes('aria-expanded')).toBe('true')
  expect(wrapper.get(webService).element).toHaveProperty('checked', true)
  await wrapper.get(eventService).setValue(true)
  expect(wrapper.findAll('h2').map((heading) => heading.text())).not.toContain('Votre sélection')
  // Hide a selected service and save from the other open card.
  await wrapper.get(webDomain).trigger('click')
  expect(wrapper.get(webDomain).attributes('aria-expanded')).toBe('false')
  expect(wrapper.get(eventService).element).toHaveProperty('checked', true)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  expect(api.saveServiceSelection).not.toHaveBeenCalled()

  expect(wrapper.get('button[type=submit]').text()).toBe('Brouillon enregistré')
  expect(wrapper.get('span[role=status]').text()).toBe('Brouillon enregistré')

  const restored = await open()
  expect(restored.get(webDomain).attributes('aria-expanded')).toBe('true')
  expect(restored.get(eventDomain).attributes('aria-expanded')).toBe('true')
  expect(restored.get(webService).element).toHaveProperty('checked', true)
  expect(restored.get(eventService).element).toHaveProperty('checked', true)
  await restored.get(webService).setValue(false)
  expect(restored.get('button[type=submit]').text()).toBe('Enregistrer mes choix')
  expect(restored.get('span[role=status]').text()).toBe('')
  expect(restored.get(eventService).element).toHaveProperty('checked', true)
  await restored.get('form').trigger('submit')
  await flushPromises()
  expect(restored.get('button[type=submit]').attributes('disabled')).toBeDefined()
  expect(api.saveServiceSelection).not.toHaveBeenCalled()

  const reopened = await open()
  expect(reopened.get(eventService).element).toHaveProperty('checked', true)
  if (reopened.get(webDomain).attributes('aria-expanded') !== 'true') {
    await reopened.get(webDomain).trigger('click')
  }
  expect(reopened.get(webService).element).toHaveProperty('checked', false)
})

it('opens a single-domain draft created before multi-domain selection', async () => {
  vi.mocked(listEducations).mockResolvedValue([education])
  vi.mocked(getOfferCandidates).mockResolvedValue([])
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    ...initial,
    revision: null,
    domainId: null,
    selected: [],
  })
  const key =
    'epolia:service-draft:' + JSON.stringify(['student', education.id, education.catalogOfferId])
  localStorage.setItem(
    key,
    JSON.stringify({
      accountState: JSON.stringify([null, null, []]),
      domainId: 'web',
      specialtyIds: [two.id],
    }),
  )
  const restored = await open()
  expect(restored.get('button[value="web"]').attributes('aria-expanded')).toBe('true')
  expect(restored.get('input[aria-label="Création de site"]').element).toHaveProperty(
    'checked',
    true,
  )
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
})

it('reconciles a stale response with newly eligible choices, keeping the still valid preference', async () => {
  const start = { ...initial, domainId: 'web', selected: [] }
  vi.mocked(api.loadServiceSelection)
    .mockResolvedValueOnce(start)
    .mockResolvedValueOnce({ ...start, revision: 'two', eligible: [three] })
  vi.mocked(api.saveServiceSelection).mockRejectedValue(new ApiError(409, 'Conflict'))
  const wrapper = await open()
  for (const checkbox of wrapper.findAll('input[type=checkbox]')) await checkbox.setValue(true)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.findAll('input[type=checkbox]')).toHaveLength(1)
  expect(wrapper.get('input[type=checkbox]').element).toHaveProperty('checked', true)
  expect(wrapper.text()).toContain('Vérifiez la sélection')
  expect(wrapper.text()).toContain('Prestations devenues indisponibles : Création de site.')
  expect(wrapper.text()).not.toContain('Vos choix sont enregistrés')
})

it('does not restore a catalogue domain that loses eligibility after a conflict', async () => {
  vi.mocked(api.loadServiceSelection)
    .mockResolvedValueOnce({ ...initial, domainId: 'web', selected: [] })
    .mockResolvedValueOnce({
      ...initial,
      revision: 'two',
      domainId: null,
      selected: [],
      eligible: [one],
    })
  vi.mocked(getServiceCatalogue).mockResolvedValue([...catalogue])
  vi.mocked(api.saveServiceSelection).mockRejectedValue(new ApiError(409, 'Conflict'))
  const wrapper = await open()
  await wrapper.get('input[aria-label="Création de site"]').setValue(true)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('button[value="web"]').element).toHaveProperty('disabled', true)
  expect(wrapper.get('button[value="images"]').attributes('aria-expanded')).toBe('true')
  expect(wrapper.find('input[aria-label="Création de site"]').exists()).toBe(false)
  expect(wrapper.text()).toContain('Domaine devenu indisponible : Web.')
})

it('keeps selections on a network failure and retries the same choice', async () => {
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    ...initial,
    domainId: 'web',
    selected: [],
  })
  vi.mocked(api.saveServiceSelection)
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce({ ...initial, revision: 'two', domainId: 'web', selected: [two] })
  const wrapper = await open()
  await wrapper.get('input[type=checkbox]').setValue(true)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('input[type=checkbox]').element).toHaveProperty('checked', true)
  expect(wrapper.text()).toContain('L’enregistrement n’a pas pu être confirmé')
  expect(localStorage.length).toBe(0)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.saveServiceSelection).toHaveBeenNthCalledWith(2, 'one', 'web', ['b'])
  expect(wrapper.text()).toContain('Vos choix sont enregistrés')
})

it('falls back to the remaining eligible domain when the stored domain still exists but is no longer available', async () => {
  vi.mocked(getServiceCatalogue).mockResolvedValue([
    ...catalogue,
    { id: 'candidate-images', family: 'Images', label: 'Agrandissement', description: '' },
  ])
  vi.mocked(api.loadServiceSelection).mockResolvedValue({ ...initial, eligible: [two] })
  const wrapper = await open()
  expect(wrapper.get('button[value="images"]').element).toHaveProperty('disabled', true)
  expect(wrapper.get('button[value="web"]').attributes('aria-expanded')).toBe('true')
  expect(wrapper.text()).toContain(one.label)
  expect(wrapper.findAll('input[type=checkbox]')).toHaveLength(1)
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
})
it('shows five catalogue domains and reveals the rest when there are no eligible services', async () => {
  const entries = Array.from({ length: 7 }, (_, index) => ({
    id: 'candidate-' + index,
    family: 'Domaine ' + index,
    label: 'Prestation ' + index,
    description: '',
  }))
  vi.mocked(getServiceCatalogue).mockResolvedValue(entries)
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    revision: null,
    domainId: null,
    domains: [],
    selected: [],
    eligible: [],
  })
  const wrapper = await open()
  expect(wrapper.findAll('button[value][aria-expanded]')).toHaveLength(5)
  expect(wrapper.find('button[value="catalogue:Domaine 6"]').exists()).toBe(false)
  expect(wrapper.get('button[aria-expanded]:not([value])').text()).toBe('Voir les autres domaines')
  await wrapper.get('button[aria-expanded]:not([value])').trigger('click')
  expect(wrapper.findAll('button[value][aria-expanded]')).toHaveLength(7)
  expect(
    wrapper
      .findAll<HTMLButtonElement>('button[value][aria-expanded]')
      .every((button) => button.element.disabled && button.attributes('aria-expanded') === 'false'),
  ).toBe(true)
  await wrapper.get('button[value="catalogue:Domaine 6"]').trigger('click')
  expect(wrapper.find('input[type=checkbox]').exists()).toBe(false)
  expect(wrapper.find('button[value][aria-expanded="true"]').exists()).toBe(false)
  await wrapper.get('button[aria-expanded]:not([value])').trigger('click')
  expect(wrapper.findAll('button[value][aria-expanded]')).toHaveLength(5)
  expect(getOfferCandidates).not.toHaveBeenCalled()
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
})

it('prioritises the domain and specialty returned for the current offer', async () => {
  vi.mocked(listEducations).mockResolvedValue([
    { ...education, id: 'expired', catalogOfferId: 'expired', endDate: '2022-01-01' },
    education,
  ])
  const course = {
    id: 'hors-cesu-110',
    label: 'Cours d’auto-maquillage',
    description: '',
    family: 'Déco, style et beauté',
  }
  vi.mocked(getServiceCatalogue).mockResolvedValue([
    { ...course, id: 'other', family: 'Vidéo et audio' },
    { ...course, id: 'deco', label: 'Décoration' },
    course,
  ])
  vi.mocked(getOfferCandidates).mockResolvedValue([course])
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    revision: null,
    domainId: null,
    domains: [],
    selected: [],
    eligible: [],
  })
  const wrapper = await open()
  expect(getOfferCandidates).toHaveBeenCalledTimes(1)
  expect(getOfferCandidates).toHaveBeenCalledWith('bts-esthetique', expect.any(AbortSignal))
  expect(wrapper.get('h2').text()).toBe('Votre domaine')
  const domains = wrapper.findAll<HTMLButtonElement>('button[value][aria-expanded]')
  expect(domains[0]?.element.value).toBe('catalogue:Déco, style et beauté')
  expect(domains[0]?.attributes('aria-expanded')).toBe('true')
  expect(domains[1]?.element.disabled).toBe(true)
  expect(wrapper.find('input[aria-label="Décoration"]').exists()).toBe(false)
  expect(wrapper.findAll('input[type=checkbox]')).toHaveLength(1)
  const control = () => wrapper.get<HTMLInputElement>('input[aria-label="Cours d’auto-maquillage"]')
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  await control().setValue(true)
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
    throw new Error('Storage unavailable')
  })
  try {
    await wrapper.get('form').trigger('submit')
    expect(control().element.checked).toBe(true)
    expect(wrapper.text()).toContain('Impossible d’enregistrer sur cet appareil.')
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  } finally {
    blocked.mockRestore()
  }
  await wrapper.get('form').trigger('submit')
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  const restored = await open()
  expect(restored.get('input[aria-label="Cours d’auto-maquillage"]').element).toHaveProperty(
    'checked',
    true,
  )
  vi.mocked(getOfferCandidates).mockResolvedValue([])
  const noLongerRecommended = await open()
  expect(noLongerRecommended.find('input[type=checkbox]:checked').exists()).toBe(false)
  await control().setValue(false)
  expect(control().element.checked).toBe(false)
  expect(wrapper.text()).toContain('BTS esthétique')
})

it('keeps a mixed selection local even with a revision and saves once only eligible items remain', async () => {
  const candidateService = { id: 'candidate', label: 'Atelier web', family: 'Web', description: '' }
  vi.mocked(listEducations).mockResolvedValue([education])
  vi.mocked(getOfferCandidates).mockResolvedValue([candidateService])
  vi.mocked(getServiceCatalogue).mockResolvedValue([
    ...catalogue,
    candidateService,
    { ...candidateService, id: 'not-recommended', label: 'Autre atelier' },
  ])
  const selection = { ...initial, domainId: 'web', selected: [] }
  vi.mocked(api.loadServiceSelection).mockResolvedValue(selection)
  vi.mocked(api.saveServiceSelection).mockResolvedValue({ ...selection, selected: [two] })
  const wrapper = await open()
  expect(wrapper.find('input[aria-label="Autre atelier"]').exists()).toBe(false)
  const candidate = () => wrapper.get<HTMLInputElement>('input[aria-label="Atelier web"]')
  await wrapper.get('input[aria-label="Création de site"]').setValue(true)
  await candidate().setValue(true)
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  await wrapper.get('form').trigger('submit')
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
  const newerSelection = { ...selection, revision: 'two', selected: [three] }
  vi.mocked(api.loadServiceSelection).mockResolvedValueOnce(newerSelection)
  const newerAccount = await open()
  expect(newerAccount.get('input[aria-label="Intégration web"]').element).toHaveProperty(
    'checked',
    true,
  )
  expect(newerAccount.get('input[aria-label="Atelier web"]').element).toHaveProperty(
    'checked',
    false,
  )
  await candidate().setValue(false)
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  await wrapper.get('form').trigger('submit')
  expect(api.saveServiceSelection).toHaveBeenCalledWith('one', 'web', [two.id])
})

it('keeps focus on the specialty when adding and removing the last selected chip', async () => {
  const wrapper = await open()
  const control = () => wrapper.get<HTMLInputElement>('input[aria-label="Montage vidéo"]')
  control().element.focus()
  await control().setValue(false)
  expect(document.activeElement).toBe(control().element)
  expect(control().element.checked).toBe(false)
  await control().setValue(true)
  expect(document.activeElement).toBe(control().element)
  expect(control().element.checked).toBe(true)
  expect(wrapper.findAll('input[type=checkbox]')).toHaveLength(1)
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
})

it('keeps historical specialties and their prices on the account without offering them in V1', async () => {
  const legacy = { id: 'legacy', label: 'Arrosage de plantes', domainId: 'garden' }
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    ...initial,
    domainId: 'garden',
    domains: [...initial.domains, { id: 'garden', label: 'Jardinage' }],
    eligible: [legacy, two],
    selected: [legacy],
  })
  vi.mocked(listEducations).mockResolvedValue([education])
  vi.mocked(getOfferCandidates).mockResolvedValue([])
  const wrapper = await open()
  expect(wrapper.find('button[value="garden"]').exists()).toBe(false)
  expect(wrapper.find('input[aria-label="Arrosage de plantes"]').exists()).toBe(false)
  expect(wrapper.get('[aria-label="Prestations conservées"]').text()).toContain(legacy.label)
  await wrapper.get('input[aria-label="Création de site"]').setValue(true)
  await wrapper.get('form').trigger('submit')
  expect(wrapper.get('button[type=submit]').text()).toBe('Brouillon enregistré')
  expect(api.saveServiceSelection).not.toHaveBeenCalled()
  expect(wrapper.getComponent(BaseModal).props('open')).toBe(false)
})
it.each(['catalogue', 'études', 'recommandations'])(
  'retries a failed %s request without displaying an empty result or losing the draft',
  async (failure) => {
    vi.mocked(api.loadServiceSelection).mockResolvedValue({
      ...initial,
      revision: null,
      eligible: [],
      selected: [],
    })
    vi.mocked(listEducations).mockResolvedValue([education])
    vi.mocked(getOfferCandidates).mockResolvedValue([catalogue[0]!])
    const wrapper = await open()
    await wrapper.get('input[type=checkbox]').setValue(true)
    await wrapper.get('form').trigger('submit')
    wrapper.unmount()
    const failed =
      failure === 'catalogue'
        ? getServiceCatalogue
        : failure === 'études'
          ? listEducations
          : getOfferCandidates
    vi.mocked(failed).mockRejectedValueOnce(new Error('offline'))
    const restored = await open()
    expect(restored.get('[role=alert]').text()).toContain('Impossible de charger')
    expect(restored.text()).not.toContain('Aucun domaine')
    const retry = restored.findAll('button').find((button) => button.text() === 'Réessayer')!
    await retry.trigger('click')
    await flushPromises()
    expect(restored.find('[role=alert]').exists()).toBe(false)
    expect(restored.get('input[aria-label="Montage vidéo"]').element).toHaveProperty(
      'checked',
      true,
    )
  },
)

it('clears an education that disappeared while retrying its recommendations', async () => {
  vi.mocked(listEducations).mockResolvedValueOnce([education]).mockResolvedValueOnce([])
  vi.mocked(getOfferCandidates).mockRejectedValueOnce(new Error('offline'))
  vi.mocked(api.loadServiceSelection).mockResolvedValue({
    ...initial,
    revision: null,
    eligible: [],
    selected: [],
  })
  const wrapper = await open()
  expect(wrapper.text()).toContain(education.title)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Réessayer')!
    .trigger('click')
  await flushPromises()
  expect(wrapper.text()).not.toContain(education.title)
  expect(getOfferCandidates).toHaveBeenCalledTimes(1)
  expect(wrapper.find('button[type=submit]').exists()).toBe(false)
})
