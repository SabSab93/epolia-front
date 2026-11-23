import type { IServiceSelectionDto } from '@/domains/services/models/dtos/serviceSelection.dto'

type ServiceDraftGroupTypes = {
  domainId: string
  specialtyIds: string[]
}

export type ServiceSelectionDraftTypes = {
  accountState: string
  activeDomainId: string
  groups: ServiceDraftGroupTypes[]
}

function isDraftGroup(value: unknown): value is ServiceDraftGroupTypes {
  return (
    !!value &&
    typeof value === 'object' &&
    'domainId' in value &&
    typeof value.domainId === 'string' &&
    'specialtyIds' in value &&
    Array.isArray(value.specialtyIds) &&
    value.specialtyIds.length > 0 &&
    value.specialtyIds.every((id) => typeof id === 'string')
  )
}

// The legacy API has no revision. Its saved domain and services still identify account changes.
export function serviceAccountState(selection: IServiceSelectionDto) {
  return JSON.stringify([
    selection.revision,
    selection.domainId,
    selection.selected.map((item) => item.id).sort(),
  ])
}

export function readServiceDraft(key: string): ServiceSelectionDraftTypes | undefined {
  const raw = localStorage.getItem(key)
  if (!raw) return
  try {
    const data: unknown = JSON.parse(raw)
    if (
      !data ||
      typeof data !== 'object' ||
      !('accountState' in data) ||
      typeof data.accountState !== 'string'
    )
      return
    const { accountState } = data
    if ('groups' in data) {
      if (
        !Array.isArray(data.groups) ||
        !data.groups.length ||
        !data.groups.every(isDraftGroup) ||
        !('activeDomainId' in data) ||
        typeof data.activeDomainId !== 'string'
      )
        return
      return { accountState, activeDomainId: data.activeDomainId, groups: data.groups }
    }
    if (isDraftGroup(data)) {
      return {
        accountState,
        activeDomainId: data.domainId,
        groups: [{ domainId: data.domainId, specialtyIds: data.specialtyIds }],
      }
    }
  } catch {
    return
  }
}
