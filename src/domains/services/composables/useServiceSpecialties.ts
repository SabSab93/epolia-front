import { computed, nextTick, useId } from 'vue'
import type { IStudentServiceDto } from '@/domains/services/models/dtos/serviceSelection.dto'

export function useServiceSpecialties(
  props: { services: IStudentServiceDto[]; selectedIds: string[]; recommendedIds: string[] },
  emit: (event: 'toggle', id: string, checked: boolean) => void,
) {
  const prefix = useId()
  const groups = computed(() => {
    const selected = props.services.filter((item) => props.selectedIds.includes(item.id))
    const remaining = props.services.filter((item) => !props.selectedIds.includes(item.id))
    const suggested = remaining.filter((item) => props.recommendedIds.includes(item.id))
    return [
      {
        key: 'selected',
        selected: true,
        label: '',
        items: selected,
      },
      {
        key: 'suggested',
        selected: false,
        label: 'Suggestions liées à votre formation',
        items: suggested,
      },
      {
        key: 'others',
        selected: false,
        label:
          selected.length || suggested.length
            ? 'Autres prestations de ce domaine'
            : 'Choisissez vos prestations.',
        items: remaining.filter((item) => !props.recommendedIds.includes(item.id)),
      },
    ]
  })

  async function change(item: IStudentServiceDto, event: Event) {
    const control = event.currentTarget as HTMLInputElement
    const hadFocus = document.activeElement === control
    emit('toggle', item.id, control.checked)
    // A toggled chip moves between groups. Restore keyboard focus after Vue moves the input.
    if (hadFocus) {
      await nextTick()
      document.getElementById(prefix + item.id)?.focus()
    }
  }
  return { prefix, groups, change }
}
