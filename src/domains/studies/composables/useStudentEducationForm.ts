import {
  nextTick,
  useId,
  useTemplateRef,
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { ApiError } from '@/shared/api/apiClient'
import {
  searchCampuses,
  getCampusOffers,
  getOfferCandidates,
  createEducation,
  updateEducation,
} from '@/domains/studies/api/studiesApi'
import type { Campus, Education, EducationInput } from '@/domains/studies/models/education'

// Changing parent selection synchronously cancels the previous read and clears
// its list. Some transports still deliver a response after cancellation.
function readOptions<T>(
  key: () => string,
  read: (id: string, signal: AbortSignal) => Promise<T[]>,
  delay = 0,
) {
  const rows = shallowRef<T[]>([])
  const state = ref<'idle' | 'loading' | 'ready' | 'error' | 'removed'>('idle')
  const attempt = ref(0)
  watch(
    [key, attempt],
    ([id], _, cleanup) => {
      rows.value = []
      state.value = id ? 'loading' : 'idle'
      if (!id) return
      const controller = new AbortController()
      async function run() {
        try {
          const result = await read(id, controller.signal)
          if (controller.signal.aborted) return
          rows.value = result
          state.value = 'ready'
        } catch (e) {
          if (!controller.signal.aborted)
            state.value = e instanceof ApiError && e.status === 404 ? 'removed' : 'error'
        }
      }
      const timer = delay ? setTimeout(run, delay) : undefined
      if (!delay) void run()
      cleanup(() => {
        controller.abort()
        clearTimeout(timer)
      })
    },
    { immediate: true, flush: 'sync' },
  )
  return {
    rows,
    state,
    retry: () => {
      attempt.value++
    },
  }
}

function matchesEducation(row: Education, input: EducationInput) {
  // An explicit null converts an older declaration to free entry even when both IDs are null.
  if (input.catalogOfferId === null && row.source !== 'MANUAL') return false
  return (Object.keys(input) as (keyof EducationInput)[]).every((key) => row[key] === input[key])
}

function newCreationKey() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // crypto.randomUUID is unavailable over HTTP on a developer's local Wi-Fi.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

export function useStudentEducationForm(
  education: Education | undefined,
  saved: (row: Education) => void,
  busy: (value: boolean) => void,
  changed: (value: boolean) => void,
) {
  const searchId = useId()
  const manualSchoolId = useId()
  const storedPanel = useTemplateRef<HTMLElement>('storedPanel')
  const chosenCampus = useTemplateRef<HTMLElement>('chosenCampus')
  const initialMode = education ? (education.source === 'MANUAL' ? 'manual' : 'stored') : 'catalog'
  const mode = ref<'manual' | 'stored' | 'catalog'>(initialMode)
  const query = ref('')
  const campus = ref<Campus>()
  const offerId = ref('')
  const title = ref(education?.title ?? '')
  const school = ref(education?.school ?? '')
  let manualCampusId = education?.catalogCampusId ?? null
  const level = ref(education?.level ?? '')
  const start = ref(education?.startDate ?? '')
  const end = ref(education?.endDate ?? '')
  const error = ref('')
  const saving = ref(false)
  let active = true
  let creationKey = ''
  onBeforeUnmount(() => {
    active = false
  })

  const {
    rows: campuses,
    state: searchState,
    retry: retrySearch,
  } = readOptions(
    () =>
      mode.value === 'catalog' && !campus.value && query.value.trim().length >= 2
        ? query.value.trim()
        : '',
    searchCampuses,
    220,
  )
  const {
    rows: offers,
    state: offerState,
    retry: retryOffers,
  } = readOptions(() => (mode.value === 'catalog' ? (campus.value?.id ?? '') : ''), getCampusOffers)
  const previewId = computed(() =>
    mode.value === 'stored'
      ? (education?.catalogOfferId ?? '')
      : mode.value === 'catalog'
        ? offerId.value
        : '',
  )
  const {
    rows: candidates,
    state: candidateState,
    retry: retryCandidates,
  } = readOptions(() => previewId.value, getOfferCandidates)

  const campusOptions = computed(() =>
    campuses.value.map((item) => {
      const address = [item.city, item.address].filter(Boolean).join(' · ')
      const same = campuses.value.some(
        (other) =>
          other.id !== item.id &&
          other.label === item.label &&
          other.city === item.city &&
          other.address === item.address,
      )
      return { item, location: same ? address + ' · ' + item.id : address }
    }),
  )
  const offerOptions = computed(() =>
    offers.value.map((offer) => ({
      value: offer.id,
      label: [offer.label, offer.level, offer.detail].filter(Boolean).join(' · '),
    })),
  )
  function selectCampus(item: Campus) {
    offerId.value = ''
    campus.value = item
    query.value = ''
    void nextTick(() => chosenCampus.value?.focus())
    error.value = ''
  }
  function searchAgain() {
    campus.value = undefined
    offerId.value = ''
    query.value = ''
    mode.value = 'catalog'
    void nextTick(() => document.getElementById(searchId)?.focus())
    error.value = ''
  }
  function enterManual() {
    if (mode.value === 'catalog' && campus.value) {
      if (manualCampusId !== campus.value.id) {
        title.value = ''
        level.value = ''
      }
      school.value = campus.value.label
      manualCampusId = campus.value.id
    }
    mode.value = 'manual'
    void nextTick(() => document.getElementById(manualSchoolId)?.focus())
    error.value = ''
  }
  function restoreOriginal() {
    searchAgain()
    mode.value = initialMode
    manualCampusId = education?.catalogCampusId ?? null
    void nextTick(() => storedPanel.value?.focus())
    title.value = education?.title ?? ''
    school.value = education?.school ?? ''
    level.value = education?.level ?? ''
  }
  const validDates = computed(() => !start.value || !end.value || start.value <= end.value)
  const validSelection = computed(() =>
    mode.value === 'manual' ? !!title.value.trim() : mode.value === 'stored' || !!offerId.value,
  )
  const dirty = computed(
    () =>
      mode.value !== initialMode ||
      (mode.value === 'catalog' && (!!campus.value || !!query.value.trim())) ||
      !!offerId.value ||
      title.value !== (education?.title ?? '') ||
      school.value !== (education?.school ?? '') ||
      level.value !== (education?.level ?? '') ||
      start.value !== (education?.startDate ?? '') ||
      end.value !== (education?.endDate ?? ''),
  )
  watch(dirty, changed, { flush: 'sync' })
  watch([mode, offerId, title, school, level, start, end], () => {
    error.value = ''
  })
  async function save() {
    if (saving.value) return
    if (!validSelection.value) {
      error.value =
        mode.value === 'manual'
          ? 'Indiquez le nom de votre formation.'
          : 'Sélectionnez une formation ou utilisez la saisie libre.'
      return
    }
    if (!validDates.value) {
      error.value = 'La fin prévue doit être le jour du début ou après.'
      return
    }
    const input: EducationInput = { startDate: start.value || null, endDate: end.value || null }
    if (mode.value === 'catalog') input.catalogOfferId = offerId.value
    if (mode.value === 'manual')
      Object.assign(input, {
        catalogOfferId: null,
        title: title.value.trim(),
        school: school.value.trim() || null,
        level: level.value.trim() || null,
      })
    if (education && matchesEducation(education, input)) {
      saved(education)
      return
    }
    error.value = ''
    saving.value = true
    busy(true)
    try {
      let row: Education
      if (education) row = await updateEducation(education.id, input)
      else {
        creationKey ||= newCreationKey()
        row = await createEducation(input, creationKey)
        if (!active) return
        // A retry may return the original creation after the student edited
        // their unsent draft. Bring that row up to date before confirming.
        if (!matchesEducation(row, input)) {
          row = await updateEducation(row.id, input)
        }
      }
      if (active) saved(row)
    } catch (e) {
      if (!active) return
      if (e instanceof ApiError && e.status === 404 && mode.value === 'catalog')
        error.value =
          'Cette formation ou votre brouillon n’est plus disponible. Vérifiez votre choix avant de réessayer.'
      else if (e instanceof ApiError && e.status === 409)
        error.value =
          'Le profil ne permet pas cet ajout. Consultez vos formations déjà enregistrées.'
      else
        error.value =
          'L’enregistrement n’a pas pu être confirmé. Votre saisie est conservée ici. Réessayez.'
    } finally {
      if (active) {
        saving.value = false
        busy(false)
      }
    }
  }
  return {
    searchId,
    manualSchoolId,
    mode,
    query,
    campus,
    offerId,
    title,
    school,
    level,
    start,
    end,
    error,
    saving,
    searchState,
    retrySearch,
    offerState,
    retryOffers,
    candidateState,
    retryCandidates,
    previewId,
    candidates,
    campusOptions,
    offerOptions,
    validDates,
    dirty,
    selectCampus,
    searchAgain,
    enterManual,
    restoreOriginal,
    save,
  }
}
