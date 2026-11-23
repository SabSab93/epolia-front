import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import {
  loadServiceSelection,
  saveServiceSelection,
} from '@/domains/services/api/serviceSelectionApi'
import { ApiError } from '@/shared/api/apiClient'

const domain = { id: 'd', label: 'Domaine du serveur' }
const service = { id: 's', domainId: 'd', label: 'Prestation du serveur' }
const snapshot = {
  revision: 'version-2',
  domainId: 'd',
  domains: [domain],
  eligible: [service],
  selected: [service],
}
beforeEach(() => {
  setActivePinia(createPinia())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('reads the live profile, eligible and selected services if only the previous API is installed', async () => {
  const read = vi
    .spyOn(useAuthStore(), 'authenticatedFetch')
    .mockRejectedValueOnce(new ApiError(404, 'Not found', 'NOT_FOUND'))
    .mockResolvedValueOnce(Response.json({ domainId: 'd' }))
    .mockResolvedValueOnce(Response.json([{ ...service, domain }]))
    .mockResolvedValueOnce(Response.json([{ specialty: service }]))
  vi.stubGlobal('fetch', vi.fn())
  expect(await loadServiceSelection(new AbortController().signal)).toEqual({
    ...snapshot,
    revision: null,
    eligible: [{ ...service, domain }],
  })
  expect(fetch).not.toHaveBeenCalled()
  expect(read.mock.calls.map(([path]) => path)).toEqual([
    '/api/student-service-selection/me',
    '/api/student-profiles/me',
    '/api/student-specialties/eligible',
    '/api/student-specialties/me',
  ])
})
it('does not fall back on denied access or a missing personal profile', async () => {
  const read = vi
    .spyOn(useAuthStore(), 'authenticatedFetch')
    .mockRejectedValue(new ApiError(404, 'Not found', 'STUDENT_PROFILE_NOT_FOUND'))
  await expect(loadServiceSelection(new AbortController().signal)).rejects.toMatchObject({
    code: 'STUDENT_PROFILE_NOT_FOUND',
  })
  expect(read).toHaveBeenCalledTimes(1)
})
it('sends the complete versioned choice without a price or a separate domain update', async () => {
  const write = vi
    .spyOn(useAuthStore(), 'authenticatedFetch')
    .mockResolvedValue(Response.json(snapshot))
  expect(await saveServiceSelection('version-1', 'd', ['s'])).toEqual(snapshot)
  expect(write).toHaveBeenCalledWith(
    '/api/student-service-selection/me',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ revision: 'version-1', domainId: 'd', specialtyIds: ['s'] }),
    }),
  )
})
it('rejects unexpected options instead of displaying them as eligible', async () => {
  vi.spyOn(useAuthStore(), 'authenticatedFetch').mockResolvedValue(
    Response.json({ ...snapshot, eligible: [{ ...service, domainId: 'unknown' }] }),
  )
  await expect(loadServiceSelection(new AbortController().signal)).rejects.toThrow()
})

it('does not confirm a response containing a different selection', async () => {
  vi.spyOn(useAuthStore(), 'authenticatedFetch').mockResolvedValue(
    Response.json({ ...snapshot, selected: [] }),
  )
  await expect(saveServiceSelection('version-1', 'd', ['s'])).rejects.toThrow()
})
