import { useAuthStore } from '@/domains/auth/stores/authStore'
import type {
  IServiceDomainDto,
  IServiceSelectionDto,
  IStudentServiceDto,
} from '@/domains/services/models/dtos/serviceSelection.dto'
import { ApiError } from '@/shared/api/apiClient'

const path = '/api/student-service-selection/me'

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
function domain(value: unknown): value is IServiceDomainDto {
  return object(value) && typeof value.id === 'string' && typeof value.label === 'string'
}
function service(value: unknown): value is IStudentServiceDto {
  return domain(value) && 'domainId' in value && typeof value.domainId === 'string'
}
function items<T extends IServiceDomainDto>(
  value: unknown,
  guard: (item: unknown) => item is T,
): T[] {
  if (
    Array.isArray(value) &&
    value.every(guard) &&
    new Set(value.map((item) => item.id)).size === value.length
  )
    return value
  throw new Error('Liste de prestations inattendue.')
}

function selection(value: unknown): IServiceSelectionDto {
  if (
    !object(value) ||
    typeof value.revision !== 'string' ||
    !value.revision ||
    !(value.domainId === null || typeof value.domainId === 'string')
  )
    throw new Error('Brouillon inattendu.')
  const domains = items(value.domains, domain)
  const eligible = items(value.eligible, service)
  if (eligible.some((item) => !domains.some((d) => d.id === item.domainId)))
    throw new Error('Domaine inconnu.')
  return {
    revision: value.revision,
    domainId: value.domainId,
    domains,
    eligible,
    selected: items(value.selected, service),
  }
}

export async function loadServiceSelection(signal: AbortSignal): Promise<IServiceSelectionDto> {
  const auth = useAuthStore()
  try {
    return selection(await (await auth.authenticatedFetch(path, { signal })).json())
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404 && error.code === 'NOT_FOUND'))
      throw error
  }
  // Back #61 supplies live choices while Back #125 is being delivered. Its
  // eligibility endpoint is scoped to the saved domain when one already exists.
  const [profileResponse, eligibleResponse, selectedResponse] = await Promise.all([
    auth.authenticatedFetch('/api/student-profiles/me', { signal }),
    auth.authenticatedFetch('/api/student-specialties/eligible', { signal }),
    auth.authenticatedFetch('/api/student-specialties/me', { signal }),
  ])
  const [profile, eligible, selected] = await Promise.all(
    [profileResponse, eligibleResponse, selectedResponse].map((r) => r.json() as Promise<unknown>),
  )
  if (
    !object(profile) ||
    !(profile.domainId === null || typeof profile.domainId === 'string') ||
    !Array.isArray(selected)
  )
    throw new Error('Profil étudiant inattendu.')
  const choices = items(eligible, service)
  const domains = new Map<string, IServiceDomainDto>()
  for (const row of choices) {
    if (!('domain' in row) || !domain(row.domain) || row.domain.id !== row.domainId)
      throw new Error('Domaine de prestation inattendu.')
    domains.set(row.domainId, row.domain)
  }
  return {
    revision: null,
    domainId: profile.domainId,
    domains: [...domains.values()],
    eligible: choices,
    selected: items(
      selected.map((row) => (object(row) ? row.specialty : undefined)),
      service,
    ),
  }
}

export async function saveServiceSelection(
  revision: string,
  domainId: string,
  specialtyIds: string[],
) {
  const response = await useAuthStore().authenticatedFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision, domainId, specialtyIds }),
  })
  const updated = selection(await response.json())
  if (
    updated.domainId !== domainId ||
    updated.selected.length !== specialtyIds.length ||
    updated.selected.some(
      (item) =>
        item.domainId !== domainId ||
        !specialtyIds.includes(item.id) ||
        !updated.eligible.some((choice) => choice.id === item.id && choice.domainId === domainId),
    )
  ) {
    throw new Error('La sélection enregistrée ne correspond pas aux choix envoyés.')
  }
  return updated
}

export function hasSavedSelection(data: IServiceSelectionDto) {
  return (
    !!data.domainId &&
    data.selected.length > 0 &&
    data.selected.every(
      (item) =>
        item.domainId === data.domainId &&
        data.eligible.some((choice) => choice.id === item.id && choice.domainId === data.domainId),
    )
  )
}
