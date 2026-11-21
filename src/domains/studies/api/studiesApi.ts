import { useAuthStore } from '@/domains/auth/stores/authStore'
import type {
  Campus,
  Candidate,
  Education,
  EducationInput,
  Offer,
} from '@/domains/studies/models/education'
import { ApiError, apiFetch } from '@/shared/api/apiClient'

const directory = '/api/education-catalog'
const educationPath = '/api/student-educations'
const invalid = () => new Error('Réponse inattendue du service des études.')

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
function nullableText(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}
function isCampus(value: unknown): value is Campus {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.city === 'string' &&
    nullableText(value.address)
  )
}
function isOffer(value: unknown): value is Offer {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.campusId === 'string' &&
    typeof value.campusLabel === 'string' &&
    nullableText(value.level) &&
    nullableText(value.detail) &&
    nullableText(value.studyFieldId)
  )
}
function isCandidate(value: unknown): value is Candidate {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.description === 'string'
  )
}
function isEducation(value: unknown): value is Education {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    (value.source === 'CATALOG' || value.source === 'MANUAL' || value.source === 'LEGACY') &&
    nullableText(value.school) &&
    nullableText(value.level) &&
    nullableText(value.startDate) &&
    nullableText(value.endDate) &&
    nullableText(value.catalogCampusId) &&
    nullableText(value.catalogOfferId) &&
    (value.studyField == null ||
      (record(value.studyField) &&
        value.studyField.id === value.studyFieldId &&
        typeof value.studyField.id === 'string' &&
        typeof value.studyField.label === 'string')) &&
    nullableText(value.studyFieldId)
  )
}
function list<T>(value: unknown, check: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value) || !value.every(check)) throw invalid()
  return value
}

export async function searchCampuses(q: string, signal?: AbortSignal) {
  const response = await apiFetch(directory + '/campuses?' + new URLSearchParams({ q }), { signal })
  return list(await response.json(), isCampus)
}
export async function getCampusOffers(campusId: string, signal?: AbortSignal) {
  const response = await apiFetch(
    directory + '/campuses/' + encodeURIComponent(campusId) + '/offers',
    { signal },
  )
  const offers = list(await response.json(), isOffer)
  if (offers.some((offer) => offer.campusId !== campusId)) throw invalid()
  return offers
}
export async function getOfferCandidates(offerId: string, signal?: AbortSignal) {
  const response = await apiFetch(
    directory + '/offers/' + encodeURIComponent(offerId) + '/candidates',
    { signal },
  )
  const value: unknown = await response.json()
  if (!record(value) || value.offerId !== offerId) throw invalid()
  return list(value.candidates, isCandidate)
}

function missingDraft(error: unknown) {
  return (
    error instanceof ApiError && error.status === 404 && error.code === 'STUDENT_PROFILE_NOT_FOUND'
  )
}

export async function listEducations(signal?: AbortSignal) {
  try {
    const response = await useAuthStore().authenticatedFetch(`${educationPath}/me`, { signal })
    return list(await response.json(), isEducation)
  } catch (error) {
    if (missingDraft(error)) return []
    throw error
  }
}

async function saved(response: Response) {
  const value: unknown = await response.json()
  if (!isEducation(value)) throw invalid()
  return value
}
export async function createEducation(input: EducationInput, key: string) {
  const auth = useAuthStore()
  const owner = auth.user?.id
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(input),
  }
  try {
    return await saved(await auth.authenticatedFetch(educationPath, options))
  } catch (error) {
    if (!missingDraft(error) || auth.user?.id !== owner) throw error
  }
  // A first-time student may not yet have a private profile. Another device can create it first.
  try {
    await auth.authenticatedFetch('/api/student-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  } catch (error) {
    if (!(
      error instanceof ApiError &&
      error.status === 409 &&
      error.code === 'STUDENT_PROFILE_ALREADY_EXISTS'
    ))
      throw error
  }
  if (auth.user?.id !== owner) throw new DOMException('Session changed', 'AbortError')
  return saved(await auth.authenticatedFetch(educationPath, options))
}
export async function updateEducation(id: string, input: EducationInput) {
  return saved(
    await useAuthStore().authenticatedFetch(`/api/student-educations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
}
