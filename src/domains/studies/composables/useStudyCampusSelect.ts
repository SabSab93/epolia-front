import { computed, onMounted, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { ICampusDto } from '@/domains/studies/models/dtos/education.dto'

export function useStudyCampusSelect(
  props: { id: string; campus?: ICampusDto; searchHint: string },
  query: Ref<string>,
) {
  const open = ref(false)
  let input: HTMLElement | null = null
  const nameIsClipped = ref(false)
  const message = computed(() => {
    if (props.campus) return [props.campus.address, props.campus.city].filter(Boolean).join(' ')
    if (!open.value && !props.searchHint && query.value.trim().length >= 2)
      return 'Sélectionnez un établissement dans la liste.'
    return props.searchHint
  })

  function measureName() {
    nameIsClipped.value = !!(
      props.campus &&
      input &&
      input.clientWidth &&
      input.scrollWidth > input.clientWidth
    )
  }

  watch(() => props.campus?.label, measureName, { flush: 'post' })
  let observer: ResizeObserver | undefined
  onMounted(() => {
    input = document.getElementById(props.id)
    measureName()
    if (input && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measureName)
      observer.observe(input)
    }
    void document.fonts?.ready.then(measureName)
  })
  onBeforeUnmount(() => observer?.disconnect())

  return { open, message, nameIsClipped }
}
