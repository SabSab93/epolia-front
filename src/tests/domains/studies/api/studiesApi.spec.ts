import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import {
  createEducation,
  getCampusOffers,
  getOfferCandidates,
  listEducations,
} from '@/domains/studies/api/studiesApi'
import { ApiError } from '@/shared/api/apiClient'

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('opens an empty draft without writing it on the first visit', async () => {
  const request = vi
    .spyOn(useAuthStore(), 'authenticatedFetch')
    .mockRejectedValue(new ApiError(404, 'Not found', 'STUDENT_PROFILE_NOT_FOUND'))
  expect(await listEducations()).toEqual([])
  expect(request).toHaveBeenCalledTimes(1)
})

it('retries the same education once if another device created the draft concurrently', async () => {
  const data = {
    id: 'study',
    title: 'MBA',
    school: 'Grenoble',
    level: null,
    startDate: null,
    endDate: null,
    catalogOfferId: 'offer',
    catalogCampusId: 'campus',
    studyFieldId: null,
    source: 'CATALOG',
  }
  const request = vi
    .spyOn(useAuthStore(), 'authenticatedFetch')
    .mockRejectedValueOnce(new ApiError(404, 'Not found', 'STUDENT_PROFILE_NOT_FOUND'))
    .mockRejectedValueOnce(new ApiError(409, 'Conflict', 'STUDENT_PROFILE_ALREADY_EXISTS'))
    .mockResolvedValueOnce(Response.json(data))
  expect(await createEducation({ catalogOfferId: 'offer' }, 'same-key')).toEqual(data)
  expect(request.mock.calls.map(([path]) => path)).toEqual([
    '/api/student-educations',
    '/api/student-profiles',
    '/api/student-educations',
  ])
  expect(request.mock.calls[2]).toEqual(request.mock.calls[0])
})

it('rejects an offer or preview returned for a different selection', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([
          {
            id: 'a',
            campusId: 'elsewhere',
            label: 'Option',
            campusLabel: 'Other',
            level: null,
            detail: null,
            studyFieldId: null,
          },
        ]),
      )
      .mockResolvedValueOnce(Response.json({ offerId: 'old', candidates: [] })),
  )
  await expect(getCampusOffers('selected')).rejects.toThrow()
  await expect(getOfferCandidates('selected')).rejects.toThrow()
})
