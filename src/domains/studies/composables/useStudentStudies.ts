import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { getCampusOffers, listEducations } from '@/domains/studies/api/studiesApi'
import type { Education } from '@/domains/studies/models/education'

const steps = [
  { id: 'studies', label: 'Études' },
  { id: 'services', label: 'Domaine et prestations' },
  { id: 'pricing', label: 'Tarifs' },
  { id: 'presentation', label: 'Présentation' },
  { id: 'travel', label: 'Rayon de déplacement' },
  { id: 'availability', label: 'Disponibilités' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'document', label: 'Justificatif scolaire' },
]

export function useStudentStudies() {
  const records = ref<Education[]>([])
  const page = ref<'loading' | 'error' | 'list' | 'form' | 'saved'>('loading')
  const selectedId = ref('')
  const current = computed(() => records.value.find((record) => record.id === selectedId.value))
  const busy = ref(false)
  const dirty = ref(false)
  let request: AbortController | undefined
  const intro = useTemplateRef<HTMLElement>('intro')
  const recordsPanel = useTemplateRef<HTMLElement>('recordsPanel')
  const savedPanel = useTemplateRef<HTMLElement>('savedPanel')
  watch(page, async (screen) => {
    await nextTick()
    const panel = screen === 'list' ? recordsPanel : screen === 'saved' ? savedPanel : intro
    panel.value?.focus()
  })
  const offerDetails = ref<Record<string, string>>({})
  const checkedCampuses = new Set<string>()
  const detailsRequest = new AbortController()
  function loadOfferDetail(record?: Education) {
    const id = record?.catalogCampusId
    if (!id || checkedCampuses.has(id)) return
    checkedCampuses.add(id)
    // The declaration retains its source IDs. Only add today's description
    // when the exact offer still exists, without blocking the student's draft.
    void getCampusOffers(id, detailsRequest.signal)
      .then((offers) => {
        if (detailsRequest.signal.aborted) return
        for (const offer of offers) if (offer.detail) offerDetails.value[offer.id] = offer.detail
      })
      .catch(() => checkedCampuses.delete(id))
  }
  function recordReference(record: Education) {
    const ids = record.catalogOfferId
    const repeated = records.value.some(
      (other) =>
        other.id !== record.id &&
        other.title === record.title &&
        other.school === record.school &&
        other.level === record.level &&
        other.catalogOfferId === ids &&
        other.catalogCampusId === record.catalogCampusId &&
        other.startDate === record.startDate &&
        other.endDate === record.endDate,
    )
    const campusPrefix =
      record.catalogCampusId && ids && !ids.startsWith(record.catalogCampusId + ':')
        ? record.catalogCampusId + ' · '
        : ''
    const origin = ids ? 'Réf. ' + campusPrefix + ids : ''
    return [origin, repeated ? 'Dossier ' + record.id : ''].filter(Boolean).join(' · ')
  }
  function canLeave() {
    return (
      !busy.value &&
      (!dirty.value ||
        window.confirm('Quitter sans enregistrer les modifications de cette formation ?'))
    )
  }
  onBeforeRouteLeave(canLeave)
  function edit(id = '') {
    if (!canLeave()) return
    dirty.value = false
    selectedId.value = id
    page.value = 'form'
    loadOfferDetail(current.value)
  }
  function chooseRecord() {
    if (!canLeave()) return
    dirty.value = false
    page.value = 'list'
    for (const record of records.value) {
      if (
        records.value.some(
          (other) =>
            other.id !== record.id &&
            other.title === record.title &&
            other.school === record.school,
        )
      )
        loadOfferDetail(record)
    }
  }
  function onSaved(record: Education) {
    busy.value = false
    dirty.value = false
    const index = records.value.findIndex((item) => item.id === record.id)
    if (index < 0) records.value.push(record)
    else records.value[index] = record
    selectedId.value = record.id
    page.value = 'saved'
  }
  async function load() {
    request?.abort()
    const controller = new AbortController()
    request = controller
    page.value = 'loading'
    try {
      const result = await listEducations(controller.signal)
      if (controller.signal.aborted) return
      records.value = result
      if (result.length > 1) chooseRecord()
      else edit(result[0]?.id)
    } catch {
      if (!controller.signal.aborted) page.value = 'error'
    }
  }
  onMounted(load)
  onBeforeUnmount(() => {
    request?.abort()
    detailsRequest.abort()
  })
  function recordPeriod(record: Education) {
    const format = (date: string) => date.split('-').reverse().join('/')
    return [
      record.startDate && 'Début le ' + format(record.startDate),
      record.endDate && 'fin prévue le ' + format(record.endDate),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  return {
    recordPeriod,
    recordReference,
    offerDetails,
    steps,
    records,
    page,
    current,
    selectedId,
    busy,
    dirty,
    edit,
    chooseRecord,
    onSaved,
    load,
  }
}
