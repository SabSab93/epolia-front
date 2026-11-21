import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, RouterView } from 'vue-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { createAppRouter } from '@/router'
import { deferred } from '@/tests/deferred'

vi.mock('@/domains/onboarding/studentSteps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domains/onboarding/studentSteps')>()
  return {
    ...actual,
    studentSteps: [
      ...actual.studentSteps.filter((step) => step.id === 'studies'),
      { id: 'example', title: 'Étape de test', component: { template: '<p>Deuxième écran</p>' } },
    ],
  }
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())
enableAutoUnmount(afterEach)
async function open(name: string, readDraft: () => Promise<Response>) {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.user = { id: 'student', roles: [AccountRoleEnum.Student], email: null, emailVerified: true }
  vi.spyOn(auth, 'restore').mockResolvedValue()
  const requests = vi.spyOn(auth, 'authenticatedFetch').mockImplementation(readDraft)
  const router = createAppRouter(createMemoryHistory(), pinia)
  await router.push({ name })
  const wrapper = mount(RouterView, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return { wrapper, router, requests }
}
const education = {
  id: 'training',
  source: 'MANUAL',
  title: 'MBA Full Stack',
  school: 'Mon école',
  level: null,
  catalogCampusId: null,
  catalogOfferId: null,
  studyFieldId: null,
  startDate: null,
  endDate: null,
}

it('keeps keyboard focus when a slow studies request finishes and advances only after save', async () => {
  const draft = deferred<Response>()
  const { wrapper, router, requests } = await open('student-studies', () => draft.promise)
  expect(document.activeElement).toBe(wrapper.get('h1').element)
  const back = wrapper.get<HTMLAnchorElement>('header a')
  back.element.focus()
  draft.resolve(Response.json([education]))
  await flushPromises()
  expect(document.activeElement).toBe(back.element)
  expect(wrapper.get('[aria-current="step"]').text()).not.toContain('Terminée')
  expect(requests).toHaveBeenCalledTimes(1)
  await wrapper.get('input[type="date"]').setValue('2026-09-01')
  const save = deferred<Response>()
  requests.mockReturnValueOnce(save.promise)
  await wrapper.get('form').trigger('submit')
  expect(router.currentRoute.value.name).toBe('student-studies')
  await flushPromises()
  expect(wrapper.get('h1').text()).toBe('Vos études')
  const updated = { ...education, startDate: '2026-09-01' }
  save.resolve(Response.json(updated))
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Étape de test'))
  expect(document.activeElement).toBe(wrapper.get('h1').element)
  expect(wrapper.text()).toContain('Étape 2 sur 2')
  expect(requests).toHaveBeenCalledTimes(2)
  requests.mockResolvedValueOnce(Response.json([updated]))
  await wrapper.get('header a').trigger('click')
  await vi.waitFor(() =>
    expect(wrapper.get<HTMLInputElement>('input[required]').element.value).toBe(updated.school),
  )
  expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe(updated.startDate)
})

it.each([
  ['saved', [{ ...education, startDate: '2026-09-01' }], 'Terminée'],
  ['missing school', [{ ...education, school: null, startDate: '2026-09-01' }], 'À compléter'],
  ['missing start date', [education], 'À compléter'],
  [
    'already ended',
    [{ ...education, startDate: '2024-09-01', endDate: '2026-11-20' }],
    'À compléter',
  ],
  ['future start', [{ ...education, startDate: '2026-11-22' }], 'À compléter'],
  ['empty', [], 'À compléter'],
  ['unavailable', null, 'Progression à vérifier'],
] as const)(
  'reads the previous step on direct entry with a %s draft',
  async (_case, rows, expected) => {
    const draft = deferred<Response>()
    const { wrapper, requests } = await open('student-example', () => draft.promise)
    expect(wrapper.get('li').text()).toContain('Progression à vérifier')
    draft.resolve(Response.json(rows))
    await flushPromises()
    expect(wrapper.get('li').text()).toContain(expected)
    expect(wrapper.get('header a').attributes('href')).toContain('/studies')
    expect(requests).toHaveBeenCalledTimes(1)
  },
)

it('protects edits when switching to the dev replay, then reloads the saved record on return', async () => {
  const saved = { ...education, startDate: '2026-09-01' }
  const { wrapper, router, requests } = await open('student-studies', async () =>
    Response.json([saved]),
  )
  await wrapper.get('input[type="date"]').setValue('2026-09-02')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
  try {
    const replay = { name: 'student-studies', query: { recommencer: '1' } }
    await router.push(replay)
    expect(router.currentRoute.value.query.recommencer).toBeUndefined()
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe('2026-09-02')
    await router.push(replay)
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe('')
    expect(wrapper.get('[aria-current="step"]').text()).not.toContain('Terminée')
    router.back()
    await vi.waitFor(() =>
      expect(wrapper.get<HTMLInputElement>('input[type="date"]').element.value).toBe(
        saved.startDate,
      ),
    )
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Terminée')
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(requests).toHaveBeenCalledTimes(3)
  } finally {
    confirm.mockRestore()
  }
})
