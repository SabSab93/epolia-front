import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentStudies from '@/domains/studies/views/StudentStudies.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import type {
  ICampusDto,
  IEducationDto,
  IOfferDto,
} from '@/domains/studies/models/dtos/education.dto'
import * as api from '@/domains/studies/api/studiesApi'

vi.mock('@/domains/studies/api/studiesApi')
const campus: ICampusDto = {
  id: 'ens',
  label: 'My Digital School Grenoble',
  city: 'Saint-Martin-d’Hères',
  address: '22 rue Galilée',
}
const mba: IOfferDto = {
  id: 'mba',
  campusId: campus.id,
  campusLabel: campus.label,
  label: 'MBA Développeur Full-stack',
  detail: '2 ans · alternance possible',
  level: 'Bac + 5',
  studyFieldId: null,
}
const stored: IEducationDto = {
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
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
  vi.resetAllMocks()
  vi.mocked(api.searchCampuses).mockResolvedValue([])
  vi.mocked(api.listEducations).mockResolvedValue([])
  vi.mocked(api.getCampusOffers).mockResolvedValue([mba])
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
})
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
async function searchAndSelect(selected: ICampusDto = campus) {
  vi.mocked(api.searchCampuses).mockResolvedValue([selected])
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const field = wrapper.get('input[autocomplete="off"]')
    await field.setValue('My Digital')
    expect(field.attributes('aria-describedby')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(220)
  } finally {
    vi.useRealTimers()
  }
  await flushPromises()
  expect(wrapper.text()).toContain(selected.address)
  await wrapper.get('[role="option"]').trigger('click')
  await flushPromises()
}
async function chooseOption(id: string) {
  wrapper.getComponent(BaseSelect).vm.$emit('update:modelValue', id)
  await nextTick()
}
it('saves the chosen offer without loading or displaying services', async () => {
  vi.mocked(api.createEducation).mockResolvedValue({ ...stored, startDate: '2026-06-10' })
  await open()
  const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
  expect(save.element.disabled).toBe(true)
  const schoolField = wrapper.get('input[role="combobox"]')
  const info = wrapper.get('p[id="' + schoolField.attributes('aria-describedby') + '"]')
  expect(info.text()).toBe('Saisissez au moins deux caractères.')
  expect(info.element.closest('[role="listbox"]')).toBeNull()
  expect(
    wrapper.getComponent(BaseSelect).get('[role="combobox"]').attributes('disabled'),
  ).toBeDefined()
  await searchAndSelect()
  expect(save.element.disabled).toBe(true)
  expect(wrapper.getComponent(BaseSelect).props('options')[0]?.label).toContain(mba.detail)
  await chooseOption(mba.id)
  await flushPromises()
  expect(api.getOfferCandidates).not.toHaveBeenCalled()
  expect(wrapper.text()).not.toContain('Prestations à l’étude')
  const start = wrapper.get('input[type="date"][required]')
  await wrapper.get('form').trigger('submit')
  expect(api.createEducation).not.toHaveBeenCalled()
  expect(start.attributes('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(start.element)
  await start.setValue('2026-06-10')
  await wrapper.get('input[type="radio"][value="2027"]').setValue()
  expect(wrapper.get<HTMLInputElement>('input[type="date"][min]').element.value).toBe('')
  expect(start.attributes('aria-invalid')).toBeUndefined()
  expect(save.element.disabled).toBe(false)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.createEducation).toHaveBeenCalledWith(
    { catalogOfferId: mba.id, startDate: '2026-06-10', endDate: null },
    expect.any(String),
  )
  expect(api.updateEducation).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Formation enregistrée')
})
it('guides students back to the school list if they close it without choosing a campus', async () => {
  vi.mocked(api.searchCampuses).mockResolvedValue([campus])
  await open()
  const field = wrapper.get('input[role="combobox"]')
  await field.setValue('Grenoble')
  await vi.waitFor(() => expect(wrapper.find('[role="option"]').exists()).toBe(true))
  await field.trigger('keydown', { key: 'Escape' })
  await vi.waitFor(() => expect(field.attributes('aria-expanded')).toBe('false'))
  const hint = wrapper.get('[id="' + field.attributes('aria-describedby') + '"]')
  expect(hint.text()).toBe('Sélectionnez un établissement dans la liste.')
  expect(api.getCampusOffers).not.toHaveBeenCalled()
})

it('restores the address of the saved campus by ID and keeps its name in the field', async () => {
  vi.mocked(api.listEducations).mockResolvedValue([stored])
  vi.mocked(api.searchCampuses).mockResolvedValue([
    { ...campus, id: 'homonym', address: 'Autre adresse' },
    campus,
  ])
  await open()
  const input = wrapper.get<HTMLInputElement>('input[role="combobox"]')
  await vi.waitFor(() =>
    expect(wrapper.get('p[id="' + input.attributes('aria-describedby') + '"]').text()).toBe(
      campus.address + ' ' + campus.city,
    ),
  )
  expect(input.element.value).toBe(campus.label)
  expect(wrapper.find('details').exists()).toBe(false)
})

it('offers the full school name only when the selected name overflows the input', async () => {
  await open()
  const input = wrapper.get<HTMLInputElement>('input[role="combobox"]')
  Object.defineProperty(input.element, 'clientWidth', { value: 240 })
  Object.defineProperty(input.element, 'scrollWidth', {
    get: () => (input.element.value === campus.label ? 320 : 240),
  })
  await searchAndSelect()
  expect(input.element.value).toBe(campus.label)
  expect(wrapper.get('details summary').text()).toContain('Voir le nom complet')
  expect(wrapper.get('details p').text()).toBe(campus.label)
  await searchAndSelect({ ...campus, id: 'short', label: 'MDS' })
  expect(input.element.value).toBe('MDS')
  expect(wrapper.find('details').exists()).toBe(false)
})

it('clears the previous course when the school search changes', async () => {
  await open()
  await searchAndSelect()
  await chooseOption(mba.id)
  await flushPromises()
  await wrapper.get('input[role="combobox"]').setValue('Autre école')
  expect(wrapper.getComponent(BaseSelect).props('modelValue')).toBe('')
  await wrapper.get('form').trigger('submit')
  expect(api.createEducation).not.toHaveBeenCalled()
})

it('opens the first available draft when no current education exists and preserves its legacy fields', async () => {
  const old = {
    ...stored,
    id: 'old',
    source: 'LEGACY' as const,
    studyFieldId: 'field',
    catalogOfferId: null,
    catalogCampusId: null,
    title: 'Formation historique',
  }
  vi.mocked(api.listEducations).mockResolvedValue([old, stored])
  vi.mocked(api.updateEducation).mockResolvedValue({ ...old, endDate: '2028-06-01' })
  await open()
  expect(wrapper.find('form').exists()).toBe(true)
  expect(api.getOfferCandidates).not.toHaveBeenCalled()
  expect(wrapper.text()).not.toContain('Réf.')
  await wrapper.get('input[type="date"][required]').setValue('2026-09-01')
  await wrapper.findAll('input[type="date"]')[1]!.setValue('2028-06-01')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.updateEducation).toHaveBeenCalledWith('old', {
    startDate: '2026-09-01',
    endDate: '2028-06-01',
  })
})
it('validates actual dates and reuses the same creation key after a lost manual-save response', async () => {
  const manual = {
    ...stored,
    title: 'Formation libre',
    school: 'Mon établissement',
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
  await button('Saisir le nom de ma formation').trigger('click')
  const [school, title] = wrapper.findAll('input[type="text"][required]')
  await title!.setValue(manual.title)
  await wrapper.get('input[type="date"]').setValue('2026-09-01')
  const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
  await school!.setValue('  ')
  expect(save.element.disabled).toBe(true)
  await wrapper.get('form').trigger('submit')
  expect(api.createEducation).not.toHaveBeenCalled()
  await school!.setValue(manual.school)
  expect(save.element.disabled).toBe(false)
  const end = wrapper.get('input[type="date"]:not([required])')
  await end.setValue('2026-01-01')
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

it('resumes the current education directly and preserves focus when switching form modes', async () => {
  const secondOffer = { ...mba, id: 'mba-2', detail: '1 an' }
  const second = {
    ...stored,
    id: 'second',
    startDate: '2026-09-01',
    catalogOfferId: secondOffer.id,
    studyField: { id: 'f', label: 'Informatique' },
  }
  vi.mocked(api.listEducations).mockResolvedValue([stored, second])
  vi.mocked(api.getCampusOffers).mockResolvedValue([mba, secondOffer])
  vi.mocked(api.updateEducation).mockResolvedValue(second)
  await open()
  expect(wrapper.text()).not.toContain('Ajouter une formation')
  expect(wrapper.text()).not.toContain('Formation à modifier')
  expect(wrapper.text()).toContain('Famille d’études · Informatique')
  expect(wrapper.text()).toContain('1 an')
  await button('Saisir ma formation manuellement').trigger('click')
  expect(document.activeElement).toBe(wrapper.find('input').element)
  await button('Garder la formation enregistrée').trigger('click')
  expect(document.activeElement).toBe(wrapper.get('input[role="combobox"]').element)
  expect(wrapper.getComponent(BaseSelect).props('modelValue')).toBe(secondOffer.id)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(document.activeElement).toBe(wrapper.get('section[aria-label="Confirmation"]').element)
})

it('opens a blank manual form and restores saved values only on explicit request', async () => {
  const row = { ...stored, startDate: '2025-09-01', endDate: '2027-06-30' }
  vi.mocked(api.listEducations).mockResolvedValue([row])
  await open()
  await searchAndSelect({ ...campus, id: 'other', label: 'École B' })
  await button('Saisir ma formation manuellement').trigger('click')
  expect(
    wrapper.findAll<HTMLInputElement>('input').every((field) => field.element.value === ''),
  ).toBe(true)
  expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
  await button('Garder la formation enregistrée').trigger('click')
  expect(wrapper.get<HTMLInputElement>('input[role="combobox"]').element.value).toBe(row.school)
  expect(wrapper.getComponent(BaseSelect).props('modelValue')).toBe(row.catalogOfferId)
  expect(wrapper.get<HTMLInputElement>('input[type="date"][required]').element.value).toBe(
    row.startDate,
  )
  expect(wrapper.get<HTMLInputElement>('input[type="date"][min]').element.value).toBe(row.endDate)
  expect(wrapper.get<HTMLInputElement>('input[type="radio"]:checked').element.value).toBe('2027')
  expect(api.updateEducation).not.toHaveBeenCalled()
})

it('resets both forms, including address, dates and year, on repeated switches', async () => {
  vi.stubEnv('VITE_MANUAL_SCHOOL_ADDRESS', 'true')
  try {
    await open()
    await searchAndSelect()
    await chooseOption(mba.id)
    await wrapper.get('input[type="date"][required]').setValue('2026-06-10')
    await wrapper.get('input[type="radio"][value="2027"]').setValue()
    await wrapper.get('input[type="date"][min]').setValue('2027-06-30')
    await button('Saisir ma formation manuellement').trigger('click')
    const textFields = () =>
      wrapper.findAll<HTMLInputElement>('input[type="text"], input[role="combobox"]')
    expect(textFields().map((field) => field.element.value)).toEqual(['', '', ''])
    await button('Saisir le nom de ma formation').trigger('click')
    const [school, address, title] = textFields()
    await school!.setValue('École B')
    await address!.setValue('Rue des Écoles')
    await title!.setValue('Formation libre')
    await wrapper.get('input[type="date"][required]').setValue('2026-09-01')
    await wrapper.get('input[type="radio"][value="2028"]').setValue()
    await wrapper.get('input[type="date"][min]').setValue('2028-06-30')
    await button('Retour aux établissements').trigger('click')
    const search = wrapper.get<HTMLInputElement>('input[role="combobox"]')
    expect(search.element.value).toBe('')
    expect(document.activeElement).toBe(search.element)
    expect(wrapper.getComponent(BaseSelect).props('modelValue')).toBe('')
    expect(wrapper.getComponent(BaseSelect).props('options')).toEqual([])
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe('')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    await wrapper.get('input[type="date"]').setValue('2026-09-01')
    expect(wrapper.find('input[type="radio"]:checked').exists()).toBe(false)
    expect(wrapper.get<HTMLInputElement>('input[type="date"][min]').element.value).toBe('')
    await button('Saisir ma formation manuellement').trigger('click')
    expect(textFields().map((field) => field.element.value)).toEqual(['', '', ''])
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe('')
    expect(api.createEducation).not.toHaveBeenCalled()
    expect(api.updateEducation).not.toHaveBeenCalled()
  } finally {
    vi.unstubAllEnvs()
  }
})

it('restores and clears the manual school address when the backend supports it', async () => {
  vi.stubEnv('VITE_MANUAL_SCHOOL_ADDRESS', 'true')
  try {
    const row: IEducationDto = {
      ...stored,
      source: 'MANUAL',
      catalogCampusId: null,
      catalogOfferId: null,
      startDate: '2025-09-01',
      schoolAddress: '22 rue Galilée, 38400 Saint-Martin-d’Hères',
    }
    vi.mocked(api.listEducations).mockResolvedValue([row])
    vi.mocked(api.updateEducation).mockResolvedValue({ ...row, schoolAddress: null })
    await open()
    expect(button('Rechercher un établissement').exists()).toBe(true)
    await button('Rechercher un établissement').trigger('click')
    await button('Saisir ma formation manuellement').trigger('click')
    expect(wrapper.findAll<HTMLInputElement>('input').every((field) => !field.element.value)).toBe(
      true,
    )
    await button('Garder la formation enregistrée').trigger('click')
    function field(label: string) {
      const caption = wrapper.findAll('label').find((item) => item.text().includes(label))!
      return wrapper.get<HTMLInputElement>('#' + caption.attributes('for'))
    }
    expect(field('Établissement').element).toBe(document.activeElement)
    expect(field('Établissement').element.value).toBe(row.school)
    expect(field('Intitulé de la formation').element.value).toBe(row.title)
    expect(field('Début des études').element.value).toBe(row.startDate)
    const address = field('Adresse de l’établissement')
    expect(address.element.value).toBe(row.schoolAddress)
    await address.setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.updateEducation).toHaveBeenCalledWith(
      row.id,
      expect.objectContaining({ schoolAddress: null }),
    )
  } finally {
    vi.unstubAllEnvs()
  }
})

it.each([true, false])(
  'reads the saved offer after a lost update before confirming a retry (revert: %s)',
  async (revert) => {
    const original = { ...stored, startDate: '2026-09-01' }
    const secondOffer = { ...mba, id: 'master', label: 'Autre master' }
    const persisted = { ...original, catalogOfferId: secondOffer.id, title: secondOffer.label }
    vi.mocked(api.listEducations)
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([persisted])
    vi.mocked(api.getCampusOffers).mockResolvedValue([mba, secondOffer])
    vi.mocked(api.updateEducation)
      .mockRejectedValueOnce(new Error('Response lost'))
      .mockResolvedValueOnce(original)
    await open()
    await chooseOption(secondOffer.id)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('L’enregistrement n’a pas pu être confirmé')
    if (revert) await chooseOption(mba.id)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.listEducations).toHaveBeenCalledTimes(2)
    expect(api.updateEducation).toHaveBeenCalledTimes(revert ? 2 : 1)
    expect(api.updateEducation).toHaveBeenLastCalledWith(
      original.id,
      expect.objectContaining({ catalogOfferId: revert ? mba.id : secondOffer.id }),
    )
    expect(wrapper.get('section[aria-label="Confirmation"]').text()).toContain(
      revert ? original.title : persisted.title,
    )
  },
)

it('only warns on leaving a new manual form when it contains an actual draft', async () => {
  const router = await open()
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await button('Saisir ma formation manuellement').trigger('click')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
    expect(confirm).not.toHaveBeenCalled()
    await router.push('/studies')
    await flushPromises()
    await button('Saisir ma formation manuellement').trigger('click')
    await wrapper.get('input[role="combobox"]').setValue('mba')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('student-studies')
    expect(confirm).toHaveBeenCalledOnce()
  } finally {
    confirm.mockRestore()
  }
})

it('clears the previous manual degree level when the student replaces the course', async () => {
  const record: IEducationDto = {
    ...stored,
    source: 'MANUAL',
    catalogOfferId: null,
    catalogCampusId: null,
    startDate: '2026-09-01',
    level: 'bac + 5',
  }
  vi.mocked(api.listEducations).mockResolvedValue([record])
  vi.mocked(api.updateEducation).mockResolvedValue({ ...record, title: 'BTS', level: null })
  await open()
  await button('Saisir le nom de ma formation').trigger('click')
  const label = wrapper.findAll('label').find((item) => item.text().includes('Intitulé'))!
  await wrapper.get('#' + label.attributes('for')).setValue('BTS')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(api.updateEducation).toHaveBeenCalledWith(
    record.id,
    expect.objectContaining({ title: 'BTS', level: null }),
  )
})
