import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentStudies from '@/domains/studies/views/StudentStudies.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import type { Campus, Education, Offer, Candidate } from '@/domains/studies/models/education'
import * as api from '@/domains/studies/api/studiesApi'
import { deferred } from '@/tests/deferred'

vi.mock('@/domains/studies/api/studiesApi')
const campus: Campus = {
  id: 'ens',
  label: 'My Digital School Grenoble',
  city: 'Saint-Martin-d’Hères',
  address: '22 rue Galilée',
}
const mba: Offer = {
  id: 'mba',
  campusId: campus.id,
  campusLabel: campus.label,
  label: 'MBA Développeur Full-stack',
  detail: '2 ans · alternance possible',
  level: 'Bac + 5',
  studyFieldId: null,
}
const stored: Education = {
  id: 'first',
  title: mba.label,
  school: campus.label,
  level: mba.level,
  source: 'CATALOG',
  catalogOfferId: mba.id,
  catalogCampusId: campus.id,
  studyFieldId: null,
  startDate: null,
  endDate: null,
}
let wrapper: VueWrapper
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.listEducations).mockResolvedValue([])
  vi.mocked(api.getCampusOffers).mockResolvedValue([mba])
  vi.mocked(api.getOfferCandidates).mockResolvedValue([])
})
afterEach(() => wrapper?.unmount())
async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: defineComponent({ template: '<p>Accueil</p>' }) },
      { path: '/studies', name: 'student-studies', component: StudentStudies },
    ],
  })
  await router.push('/studies')
  wrapper = mount(RouterView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return router
}
function button(text: string) {
  const target = wrapper.findAll('button').find((b) => b.text().includes(text))
  if (!target) throw new Error('Bouton absent : ' + text)
  return target
}
async function searchAndSelect(selected: Campus = campus) {
  vi.mocked(api.searchCampuses).mockResolvedValue([selected])
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await wrapper.get('input[autocomplete="off"]').setValue('My Digital')
    await vi.advanceTimersByTimeAsync(220)
  } finally {
    vi.useRealTimers()
  }
  await flushPromises()
  expect(wrapper.text()).toContain(selected.address)
  await button(selected.label).trigger('click')
  await flushPromises()
}
async function chooseOffer(id: string) {
  wrapper.getComponent(BaseSelect).vm.$emit('update:modelValue', id)
  await nextTick()
}
it('shows campus address, offer details and candidates before saving the chosen offer', async () => {
  vi.mocked(api.getOfferCandidates).mockResolvedValue([
    {
      id: 'candidate',
      label: 'Aide numérique à domicile',
      description: 'Accompagnement du particulier.',
    },
  ])
  vi.mocked(api.createEducation).mockResolvedValue(stored)
  await open()
  await searchAndSelect()
  expect(wrapper.getComponent(BaseSelect).props('options')[0]?.label).toContain(mba.detail)
  await chooseOffer(mba.id)
  await flushPromises()
  expect(wrapper.text()).toContain('Aide numérique à domicile')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.createEducation).toHaveBeenCalledWith(
    { catalogOfferId: mba.id, startDate: null, endDate: null },
    expect.any(String),
  )
  expect(api.updateEducation).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Formation enregistrée')
})
it('requires an explicit choice among existing records and preserves an older unlinked declaration', async () => {
  const old = {
    ...stored,
    id: 'old',
    source: 'LEGACY' as const,
    studyFieldId: 'field',
    catalogOfferId: null,
    catalogCampusId: null,
    title: 'Formation historique',
  }
  vi.mocked(api.listEducations).mockResolvedValue([stored, old])
  vi.mocked(api.updateEducation).mockResolvedValue({ ...old, endDate: '2028-06-01' })
  await open()
  expect(wrapper.find('form').exists()).toBe(false)
  await button(old.title).trigger('click')
  expect(api.getOfferCandidates).not.toHaveBeenCalled()
  expect(wrapper.text()).not.toContain('Réf.')
  await wrapper.findAll('input[type="date"]')[1]!.setValue('2028-06-01')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.updateEducation).toHaveBeenCalledWith('old', {
    startDate: null,
    endDate: '2028-06-01',
  })
})
it('ignores obsolete previews when the selected program changes; a failure is distinct from an empty response', async () => {
  const stale = deferred<Candidate[]>()
  vi.mocked(api.getCampusOffers).mockResolvedValue([
    mba,
    { ...mba, id: 'other', label: 'Autre formation' },
  ])
  vi.mocked(api.getOfferCandidates)
    .mockReturnValueOnce(stale.promise)
    .mockRejectedValueOnce(new Error('notice'))
    .mockResolvedValueOnce([])
  await open()
  await searchAndSelect()
  await chooseOffer(mba.id)
  await chooseOffer('other')
  await flushPromises()
  stale.resolve([{ id: 'obsolete', label: 'RÉSULTAT OBSOLÈTE', description: '' }])
  await flushPromises()
  expect(wrapper.text()).not.toContain('RÉSULTAT OBSOLÈTE')
  expect(wrapper.text()).toContain('L’aperçu des prestations est indisponible')
  await button('Recharger les prestations').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('Aucune prestation associée')
})
it('validates actual dates and reuses the same creation key after a lost manual-save response', async () => {
  const manual = {
    ...stored,
    title: 'Formation libre',
    school: null,
    level: null,
    source: 'MANUAL' as const,
    catalogCampusId: null,
    catalogOfferId: null,
    startDate: '2026-09-01',
    endDate: null,
  }
  vi.mocked(api.createEducation)
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce(manual)
  await open()
  await button('Saisir ma formation manuellement').trigger('click')
  await wrapper.get('input[required]').setValue(manual.title)
  const [start, end] = wrapper.findAll('input[type="date"]')
  await start!.setValue('2026-09-01')
  await end!.setValue('2026-01-01')
  await wrapper.get('form').trigger('submit')
  expect(api.createEducation).not.toHaveBeenCalled()
  await end!.setValue('')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.text()).toContain('L’enregistrement n’a pas pu être confirmé')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  const attempts = vi.mocked(api.createEducation).mock.calls
  expect(attempts).toHaveLength(2)
  expect(attempts[0]).toEqual(attempts[1])
  expect(attempts[0]?.[0]).toMatchObject({
    catalogOfferId: null,
    title: manual.title,
    startDate: '2026-09-01',
    endDate: null,
  })
  expect(wrapper.text()).toContain('Formation enregistrée')
})

it('protects an unfinished new search and campus selection when leaving the form', async () => {
  const router = await open()
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await wrapper.get('input[autocomplete="off"]').setValue('Grenoble')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('student-studies')
    await searchAndSelect()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('student-studies')
    expect(confirm).toHaveBeenCalledTimes(2)
  } finally {
    confirm.mockRestore()
  }
})

it('keeps homonymous declarations distinguishable at resume and moves focus after each change of screen', async () => {
  const secondOffer = { ...mba, id: 'mba-2', detail: '1 an' }
  const second = {
    ...stored,
    id: 'second',
    catalogOfferId: secondOffer.id,
    studyField: { id: 'f', label: 'Informatique' },
  }
  vi.mocked(api.listEducations).mockResolvedValue([stored, second])
  vi.mocked(api.getCampusOffers).mockResolvedValue([mba, secondOffer])
  vi.mocked(api.updateEducation).mockResolvedValue(second)
  await open()
  const list = wrapper.get('section[aria-label="Vos formations enregistrées"]')
  expect(document.activeElement).toBe(list.element)
  const pick = button('ens · mba-2')
  expect(pick.text()).toContain('1 an')
  await pick.trigger('click')
  expect(wrapper.text()).toContain('Famille d’études · Informatique')
  expect(wrapper.text()).toContain('ens · mba-2')
  expect(wrapper.text()).toContain('1 an')
  await button('Saisir ma formation manuellement').trigger('click')
  expect(document.activeElement).toBe(wrapper.find('input').element)
  await button('Garder la formation enregistrée').trigger('click')
  expect(document.activeElement?.textContent).toContain(stored.title)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(document.activeElement).toBe(wrapper.get('section[aria-label="Confirmation"]').element)
  await button('Retrouver mes formations').trigger('click')
  expect(document.activeElement).toBe(
    wrapper.get('section[aria-label="Vos formations enregistrées"]').element,
  )
  expect(api.getCampusOffers).toHaveBeenCalledTimes(1)
})

it('prefills only the chosen replacement campus in free entry and preserves the original when explicitly restored', async () => {
  vi.mocked(api.listEducations).mockResolvedValue([stored])
  await open()
  expect(wrapper.text()).not.toContain('Réf.')
  await button('Choisir une autre formation').trigger('click')
  const next = { id: 'ens-b', label: 'École B', city: 'Meylan', address: '1 rue des Écoles' }
  await searchAndSelect(next)
  await button('Saisir ma formation manuellement').trigger('click')
  const values = () =>
    wrapper.findAll('input[type="text"]').map((field) => (field.element as HTMLInputElement).value)
  expect(values()).toEqual([next.label, '', ''])
  await button('Garder la formation enregistrée').trigger('click')
  await button('Saisir ma formation manuellement').trigger('click')
  expect(values()).toEqual([stored.school, stored.title, stored.level])
})
