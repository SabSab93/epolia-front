import { isCompleteCurrentEducation } from '@/domains/studies/models/education'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { isStudentReplay } from '@/domains/onboarding/studentSteps'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { getCampusOffers, listEducations } from '@/domains/studies/api/studiesApi'
import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'

export function useStudentStudies(emit: {
  (event: 'saved'): void
  (event: 'restored', saved: boolean): void
}) {
  const route = useRoute()
  const replay = computed(() => isStudentReplay(route.query))
  const records = ref<IEducationDto[]>([])
  const page = ref<'loading' | 'error' | 'list' | 'form' | 'saved'>('loading')
  const selectedId = ref('')
  const current = computed(() => records.value.find((record) => record.id === selectedId.value))
  const busy = ref(false)
  const dirty = ref(false)
  let request: AbortController | undefined
  const intro = useTemplateRef<HTMLElement>('intro')
  const recordsPanel = useTemplateRef<HTMLElement>('recordsPanel')
  const savedPanel = useTemplateRef<HTMLElement>('savedPanel')
  watch(
    page,
    (screen, previous) => {
      if (previous === 'loading') return
      const panel = screen === 'list' ? recordsPanel : screen === 'saved' ? savedPanel : intro
      panel.value?.focus()
    },
    { flush: 'post' },
  )
  const offerDetails = ref<Record<string, string>>({})
  const checkedCampuses = new Set<string>()
  const detailsRequest = new AbortController()
  function loadOfferDetail(record?: IEducationDto) {
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
  function recordReference(record: IEducationDto) {
    const ids = record.catalogOfferId
    const homonyms = records.value.filter(
      (other) =>
        other.id !== record.id &&
        other.title === record.title &&
        other.school === record.school &&
        other.level === record.level,
    )
    if (!homonyms.length) return ''
    const repeated = homonyms.some(
      (other) =>
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
  onBeforeRouteUpdate(
    (to, from) => isStudentReplay(to.query) === isStudentReplay(from.query) || canLeave(),
  )
  function edit(id = '') {
    if (!canLeave()) return
    dirty.value = false
    selectedId.value = id
    page.value = 'form'
    if (current.value?.source !== 'CATALOG') loadOfferDetail(current.value)
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
  function onSaved(record: IEducationDto) {
    busy.value = false
    dirty.value = false
    const index = records.value.findIndex((item) => item.id === record.id)
    if (index < 0) records.value.push(record)
    else records.value[index] = record
    selectedId.value = record.id
    page.value = 'saved'
    emit('saved')
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
      emit('restored', !replay.value && result.some(isCompleteCurrentEducation))
      if (replay.value) edit()
      else if (result.length > 1) chooseRecord()
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
  function recordPeriod(record: IEducationDto) {
    const format = (date: string) => date.split('-').reverse().join('/')
    return [
      record.startDate && 'Début le ' + format(record.startDate),
      record.endDate && 'fin prévue le ' + format(record.endDate),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  const recordOptions = computed(() =>
    records.value.map((record) => ({
      value: record.id,
      label: [
        record.title,
        record.school,
        record.level,
        recordPeriod(record),
        offerDetails.value[record.catalogOfferId ?? ''],
        recordReference(record),
      ]
        .filter(Boolean)
        .join(' · '),
    })),
  )
  return {
    recordOptions,
    recordReference,
    offerDetails,
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
