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
import { todayForStudies } from '@/domains/studies/models/education'
import { useStudyEndDate } from '@/domains/studies/composables/useStudyEndDate'
import { ApiError } from '@/shared/api/apiClient'
import {
  searchCampuses,
  getCampusOffers,
  listEducations,
  createEducation,
  updateEducation,
} from '@/domains/studies/api/studiesApi'
import type {
  ICampusDto,
  IEducationDto,
  IEducationInputDto,
} from '@/domains/studies/models/dtos/education.dto'

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

function matchesEducation(row: IEducationDto, input: IEducationInputDto) {
  // An explicit null converts an older declaration to free entry even when both IDs are null.
  if (input.catalogOfferId === null && row.source !== 'MANUAL') return false
  return (Object.keys(input) as (keyof IEducationInputDto)[]).every(
    (key) => row[key] === input[key],
  )
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
  education: IEducationDto | undefined,
  emit: {
    (event: 'saved', row: IEducationDto): void
    (event: 'busy', value: boolean): void
    (event: 'dirty', value: boolean): void
  },
) {
  const searchId = useId()
  const manualSchoolId = useId()
  const startId = useId()
  const storedPanel = useTemplateRef<HTMLElement>('storedPanel')
  const originalCampus: ICampusDto | undefined =
    education?.source === 'CATALOG' &&
    education.catalogCampusId &&
    education.catalogOfferId &&
    education.school
      ? { id: education.catalogCampusId, label: education.school, city: '', address: null }
      : undefined
  const originalOfferId = originalCampus ? (education?.catalogOfferId ?? '') : ''
  const initialMode =
    !education || originalCampus ? 'catalog' : education.source === 'MANUAL' ? 'manual' : 'stored'
  const mode = ref<'manual' | 'stored' | 'catalog'>(initialMode)
  const fromCatalog = ref(false)
  const query = ref('')
  const campus = ref<ICampusDto | undefined>(originalCampus)
  const offerId = ref(originalOfferId)
  const title = ref(education?.title ?? '')
  const titleDraft = ref('')
  const school = ref(education?.school ?? '')
  const addressEnabled = import.meta.env.VITE_MANUAL_SCHOOL_ADDRESS === 'true'
  const schoolAddress = ref(education?.schoolAddress ?? '')
  const start = ref(education?.startDate ?? '')
  const startMissing = ref(false)
  watch(start, () => {
    startMissing.value = false
  })
  const end = ref(education?.endDate ?? '')
  const error = ref('')
  const saving = ref(false)
  let active = true
  let creationKey = ''
  let verifyPreviousUpdate = false
  onBeforeUnmount(() => {
    active = false
  })

  const {
    rows: campuses,
    state: searchState,
    retry: retrySearch,
  } = readOptions(
    () => {
      if (mode.value !== 'catalog') return ''
      // A saved education carries the campus ID and name, but not its address.
      const term = campus.value
        ? campus.value.city
          ? ''
          : campus.value.label.slice(0, 100)
        : query.value
      return term.trim().length >= 2 ? term.trim() : ''
    },
    searchCampuses,
    220,
  )
  const {
    rows: offers,
    state: offerState,
    retry: retryOffers,
  } = readOptions(() => (mode.value === 'catalog' ? (campus.value?.id ?? '') : ''), getCampusOffers)
  const savedOfferUnavailable = computed(
    () =>
      !!originalOfferId &&
      (offerState.value === 'removed' ||
        (offerState.value === 'ready' &&
          !offers.value.some((offer) => offer.id === originalOfferId))),
  )

  const schoolSearch = computed({
    get: () => campus.value?.label ?? query.value,
    set(value: string) {
      if (value === (campus.value?.label ?? query.value)) return
      campus.value = undefined
      offerId.value = ''
      query.value = value
    },
  })
  const searchHint = computed(() => {
    if (searchState.value === 'error') return 'La recherche des établissements est indisponible.'
    if (searchState.value === 'ready')
      return campuses.value.length ? '' : 'Aucun établissement trouvé.'
    return schoolSearch.value.trim().length < 2 ? 'Saisissez au moins deux caractères.' : ''
  })
  const selectedCampus = computed(() => {
    const selected = campus.value
    if (!selected || selected.city) return selected
    const match = campuses.value.find((item) => item.id === selected.id)
    return match ? { ...selected, address: match.address, city: match.city } : selected
  })
  const campusOptions = computed(() =>
    (selectedCampus.value ? [selectedCampus.value] : campuses.value).map((item) => {
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
  const offerOptions = computed(() => {
    const options = offers.value.map((offer) => ({
      value: offer.id,
      label: [offer.label, offer.level, offer.detail].filter(Boolean).join(' · '),
    }))
    // An archived offer can still be kept when the student only edits the dates.
    if (
      originalCampus &&
      campus.value?.id === originalCampus.id &&
      education &&
      !options.some((o) => o.value === originalOfferId)
    ) {
      options.unshift({
        value: originalOfferId,
        label: [education.title, education.level].filter(Boolean).join(' · '),
      })
    }
    return options
  })
  function selectCampus(item: ICampusDto) {
    if (campus.value?.id === item.id) return
    offerId.value = ''
    campus.value = item
    query.value = ''
    error.value = ''
  }
  const endDateField = useStudyEndDate(start, end)
  const { today, dateError, selectedYear } = endDateField
  const startError = computed(
    () =>
      endDateField.startDateError.value ||
      (startMissing.value ? 'Indiquez la date de début de vos études.' : ''),
  )
  const originalYear = selectedYear.value
  function changeEntryMode(nextMode: 'catalog' | 'manual') {
    fromCatalog.value = mode.value === 'catalog'
    mode.value = nextMode
    query.value = ''
    campus.value = undefined
    offerId.value = ''
    school.value = ''
    schoolAddress.value = ''
    title.value = ''
    titleDraft.value = ''
    start.value = ''
    endDateField.omitEndDate()
    startMissing.value = false
    error.value = ''
    const field = nextMode === 'manual' ? manualSchoolId : searchId
    void nextTick(() => document.getElementById(field)?.focus())
  }
  function restoreOriginal() {
    fromCatalog.value = false
    query.value = ''
    campus.value = originalCampus
    offerId.value = originalOfferId
    mode.value = initialMode
    start.value = education?.startDate ?? ''
    end.value = education?.endDate ?? ''
    selectedYear.value = originalYear
    startMissing.value = false
    error.value = ''
    void nextTick(() => {
      const field = initialMode === 'manual' ? manualSchoolId : searchId
      const target = initialMode === 'stored' ? storedPanel.value : document.getElementById(field)
      target?.focus()
    })
    title.value = education?.title ?? ''
    titleDraft.value = ''
    school.value = education?.school ?? ''
    schoolAddress.value = education?.schoolAddress ?? ''
  }
  const selectionError = computed(() => {
    if (mode.value === 'catalog') {
      if (!campus.value) return 'Sélectionnez un établissement ou utilisez la saisie libre.'
      if (!offerId.value) return 'Sélectionnez une formation ou utilisez la saisie libre.'
    } else {
      if (!school.value.trim()) return 'Indiquez le nom de votre établissement.'
      if (!title.value.trim()) return 'Indiquez le nom de votre formation.'
    }
    return ''
  })
  const canSave = computed(
    () =>
      !saving.value && !selectionError.value && endDateField.validStart.value && !dateError.value,
  )
  const selectionChanged = computed(
    () =>
      (!!education && mode.value !== initialMode) ||
      (mode.value === 'catalog' &&
        (campus.value?.id !== originalCampus?.id ||
          offerId.value !== originalOfferId ||
          !!query.value.trim())),
  )
  const dirty = computed(
    () =>
      selectionChanged.value ||
      (mode.value === 'manual' &&
        ((!title.value && !!titleDraft.value.trim()) ||
          title.value !== (education?.title ?? '') ||
          school.value !== (education?.school ?? '') ||
          (addressEnabled && schoolAddress.value !== (education?.schoolAddress ?? '')))) ||
      start.value !== (education?.startDate ?? '') ||
      end.value !== (education?.endDate ?? ''),
  )
  watch(dirty, (value) => emit('dirty', value), { flush: 'sync' })
  watch([mode, offerId, title, school, schoolAddress, start, end, selectedYear], () => {
    error.value = ''
  })
  async function save() {
    if (saving.value) return
    today.value = todayForStudies()
    if (!canSave.value) {
      if (selectionError.value || dateError.value) {
        error.value = selectionError.value || dateError.value
      } else {
        startMissing.value = !start.value
        await nextTick()
        document.getElementById(startId)?.focus()
      }
      return
    }
    const input: IEducationInputDto = { startDate: start.value, endDate: end.value || null }
    if (mode.value === 'catalog') input.catalogOfferId = offerId.value
    if (mode.value === 'manual') {
      input.catalogOfferId = null
      input.title = title.value.trim()
      input.school = school.value.trim()
      if (education) {
        const sameCourse =
          education.source === 'MANUAL' &&
          input.title === education.title &&
          input.school === education.school
        input.level = sameCourse ? education.level : null
      }
      if (addressEnabled) input.schoolAddress = schoolAddress.value.trim() || null
    }
    if (education && !verifyPreviousUpdate && matchesEducation(education, input)) {
      emit('saved', education)
      return
    }
    error.value = ''
    saving.value = true
    emit('busy', true)
    try {
      let row: IEducationDto
      if (education) {
        // A lost PATCH response can leave the server ahead of the form's initial values.
        if (verifyPreviousUpdate) {
          const records = await listEducations()
          if (!active) return
          const persisted = records.find((record) => record.id === education.id)
          if (!persisted) {
            error.value = 'Cette formation ne figure plus dans votre compte.'
            return
          }
          if (
            mode.value === 'stored' &&
            (persisted.source !== education.source ||
              persisted.catalogOfferId !== education.catalogOfferId)
          ) {
            error.value =
              'La formation enregistrée a changé. Choisissez la formation que vous souhaitez garder.'
            return
          }
          if (matchesEducation(persisted, input)) {
            verifyPreviousUpdate = false
            emit('saved', persisted)
            return
          }
        }
        verifyPreviousUpdate = true
        row = await updateEducation(education.id, input)
      } else {
        creationKey ||= newCreationKey()
        row = await createEducation(input, creationKey)
        if (!active) return
        // A retry may return the original creation after the student edited
        // their unsent draft. Bring that row up to date before confirming.
        if (!matchesEducation(row, input)) {
          row = await updateEducation(row.id, input)
        }
      }
      if (input.schoolAddress !== undefined && (row.schoolAddress ?? null) !== input.schoolAddress)
        throw new Error('Adresse non confirmée par le serveur')
      verifyPreviousUpdate = false
      if (active) emit('saved', row)
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
        emit('busy', false)
      }
    }
  }
  return {
    searchId,
    manualSchoolId,
    addressEnabled,
    schoolAddress,
    startId,
    startError,
    mode,
    schoolSearch,
    searchHint,
    campus: selectedCampus,
    offerId,
    title,
    titleDraft,
    school,
    start,
    end,
    error,
    saving,
    canSave,
    searchState,
    retrySearch,
    offerState,
    retryOffers,
    savedOfferUnavailable,
    campusOptions,
    offerOptions,
    selectionChanged,
    ...endDateField,
    dirty,
    selectCampus,
    changeEntryMode,
    fromCatalog,
    restoreOriginal,
    save,
  }
}
