import type {
  IServiceSelectionDto,
  IStudentServiceDto,
} from '@/domains/services/models/dtos/serviceSelection.dto'
import type { IServiceCatalogueEntryDto } from '@/domains/studies/models/dtos/education.dto'

export function serviceDomainChoices(
  selection: IServiceSelectionDto | undefined,
  catalogue: IServiceCatalogueEntryDto[],
  recommendedIds: string[],
) {
  const recommended = new Set(recommendedIds)
  const eligible = new Map(selection?.eligible.map((item) => [item.id, item]))
  const groups = new Map<string, { value: string; label: string; services: IStudentServiceDto[] }>()

  function add(domainId: string, label: string, service: IStudentServiceDto) {
    const group = groups.get(domainId) ?? { value: domainId, label, services: [] }
    group.services.push(service)
    groups.set(domainId, group)
  }

  const domains = selection?.domains ?? []
  for (const item of catalogue) {
    const serverService = eligible.get(item.id)
    const domain = serverService
      ? domains.find((d) => d.id === serverService.domainId)
      : domains.find((d) => d.label === item.family)
    const domainId = domain?.id ?? 'catalogue:' + item.family
    add(domainId, domain?.label ?? item.family, { id: item.id, label: item.label, domainId })
  }

  const choices = [...groups.values()].map((group) => {
    const services = group.services.filter(
      (item) => eligible.has(item.id) || recommended.has(item.id),
    )
    return {
      value: group.value,
      label: group.label,
      disabled: services.length === 0,
      recommended: services.some((item) => recommended.has(item.id)),
      services: services.sort(
        (a, b) => Number(recommended.has(b.id)) - Number(recommended.has(a.id)),
      ),
    }
  })
  return choices.sort(
    (a, b) =>
      Number(a.disabled) - Number(b.disabled) || Number(b.recommended) - Number(a.recommended),
  )
}
