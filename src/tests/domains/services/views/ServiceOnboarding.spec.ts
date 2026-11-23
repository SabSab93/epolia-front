import { createPinia } from 'pinia'
import { createMemoryHistory, RouterView } from 'vue-router'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { createAppRouter } from '@/router'
import { ApiError } from '@/shared/api/apiClient'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

it('opens services as the second step after saving studies and lets the student try suggestions for the saved education', async () => {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.user = { id: 'student', roles: [AccountRoleEnum.Student], email: null, emailVerified: true }
  vi.spyOn(auth, 'restore').mockResolvedValue()
  const education = {
    id: 'saved',
    source: 'CATALOG',
    title: 'MBA Full-stack',
    school: 'Mon école',
    startDate: '2021-09-01',
    endDate: null,
    level: null,
    studyFieldId: null,
    catalogCampusId: 'campus',
    catalogOfferId: 'campus:full-stack',
  }
  let enteringServices = false
  const reads = vi.spyOn(auth, 'authenticatedFetch').mockImplementation(async (path) => {
    switch (path) {
      case '/api/student-educations/me':
        return Response.json(
          enteringServices
            ? [
                { ...education, id: 'other', title: 'Autre cursus', catalogOfferId: 'other' },
                education,
              ]
            : [education],
        )
      case '/api/student-service-selection/me':
        throw new ApiError(404, 'Missing route', 'NOT_FOUND')
      case '/api/student-profiles/me':
        return Response.json({ domainId: null })
      case '/api/student-specialties/me':
      case '/api/student-specialties/eligible':
        return Response.json([])
      default:
        throw new Error('Unexpected request ' + path)
    }
  })
  const candidate = {
    id: 'candidate',
    family: 'Famille du MBA',
    label: 'Aperçu du parcours',
    description: '',
  }
  const publicFetch = vi.fn(async (url: string) => {
    const path = new URL(url).pathname
    if (path === '/api/education-catalog/candidates') return Response.json([candidate])
    if (path === '/api/education-catalog/offers/campus%3Afull-stack/candidates')
      return Response.json({ offerId: education.catalogOfferId, candidates: [candidate] })
    return Response.json([])
  })
  vi.stubGlobal('fetch', publicFetch)
  const router = createAppRouter(createMemoryHistory(), pinia)
  await router.push({ name: 'student-studies' })
  const wrapper = mount(RouterView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  expect(router.hasRoute('student-justificatif')).toBe(false)
  expect(reads.mock.calls.some(([path]) => path.includes('/student-specialties/'))).toBe(false)
  expect(wrapper.get('[role="group"] [aria-live="polite"]').text()).toBe('1/2')
  enteringServices = true
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Aperçu du parcours'))
  expect(wrapper.get('header a').attributes('href')).toBe('/compte/parcours-etudiant/studies')
  const progress = wrapper.get('[role="group"]').findAll('li')
  expect(progress.map((step) => step.text())).toEqual([
    expect.stringContaining('Vos études'),
    expect.stringContaining('Que proposez-vous ?'),
  ])
  expect(wrapper.get('[role="group"] [aria-live="polite"]').text()).toBe('2/2')
  expect(router.currentRoute.value.name).toBe('student-services')
  expect(wrapper.get('h1').text()).toBe('Que proposez-vous ?')
  expect(
    publicFetch.mock.calls
      .map(([url]) => new URL(url).pathname)
      .filter((path) => path.endsWith('/candidates') && path.includes('/offers/')),
  ).toEqual(['/api/education-catalog/offers/campus%3Afull-stack/candidates'])
  expect(wrapper.get('button[value="catalogue:Famille du MBA"]').attributes('aria-expanded')).toBe(
    'true',
  )
  await wrapper.get('input[aria-label="Aperçu du parcours"]').setValue(true)
  expect(wrapper.get('input[aria-label="Aperçu du parcours"]').element).toHaveProperty(
    'checked',
    true,
  )
  expect(wrapper.text()).toContain('Famille du MBA')
  expect(wrapper.text()).not.toContain('Autre cursus')
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  expect(wrapper.text()).not.toContain('Votre brouillon est enregistré sur cet appareil.')
  expect(reads.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true)
})
