import { computed, nextTick, ref, shallowRef, useId, watch, type Ref } from 'vue'

export function useManualEducationTitle(title: Ref<string>, draft: Ref<string>) {
  const fieldId = useId()
  const freeEntry = ref(false)
  const open = ref(false)
  const matches = shallowRef<string[]>([])
  const pageSize = 25
  const visibleCount = ref(pageSize)
  const titles = computed(() => matches.value.slice(0, visibleCount.value))
  function showMore() {
    if (visibleCount.value < matches.value.length) visibleCount.value += pageSize
  }
  const state = ref<'idle' | 'ready' | 'error'>('idle')
  const query = computed<string>({
    get: () => title.value || draft.value,
    set(value: string) {
      if (value === query.value) return
      draft.value = value
      title.value = ''
    },
  })
  const hint = computed(() => {
    if (title.value) return ''
    if (!open.value && query.value.trim().length >= 2)
      return 'Sélectionnez une formation dans la liste.'
    if (titles.value.length) return ''
    if (state.value === 'error') return 'Les suggestions Onisep sont indisponibles.'
    if (state.value === 'ready') return 'Aucune formation trouvée.'
    return query.value.trim().length < 2 ? 'Saisissez au moins deux caractères.' : ''
  })

  watch(
    () =>
      open.value && !freeEntry.value && !title.value
        ? draft.value.trim().toLocaleLowerCase('fr')
        : '',
    async (term, _, onCleanup) => {
      matches.value = title.value ? [title.value] : []
      visibleCount.value = pageSize
      state.value = 'idle'
      if (term.length < 2) return
      let current = true
      onCleanup(() => {
        current = false
      })
      try {
        const { lookupTitles } = await import('@/domains/studies/api/onisepTitleIndex')
        if (!current) return
        matches.value = lookupTitles(term)
        state.value = 'ready'
      } catch {
        if (current) state.value = 'error'
      }
    },
    { immediate: true },
  )
  function choose(value: string) {
    draft.value = value
    title.value = value
    open.value = false
  }
  async function toggleEntry() {
    freeEntry.value = !freeEntry.value
    open.value = !freeEntry.value
    draft.value = ''
    title.value = ''
    await nextTick()
    document.getElementById(fieldId)?.focus()
  }

  return {
    fieldId,
    query,
    titles,
    showMore,
    open,
    freeEntry,
    state,
    hint,
    choose,
    toggleEntry,
  }
}
