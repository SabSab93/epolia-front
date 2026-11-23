import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  hasSavedSelection,
  loadServiceSelection,
  saveServiceSelection,
} from '@/domains/services/api/serviceSelectionApi'
import type { IServiceSelectionDto } from '@/domains/services/models/dtos/serviceSelection.dto'
import { useStudyServicePreview } from '@/domains/services/composables/useStudyServicePreview'
import { serviceDomainChoices } from '@/domains/services/models/serviceDomainChoices'
import {
  readServiceDraft,
  serviceAccountState,
  type ServiceSelectionDraftTypes,
} from '@/domains/services/models/serviceSelectionDraft'
import { useAuthStore } from '@/domains/auth/stores/authStore'
import { ApiError } from '@/shared/api/apiClient'

export function useStudentServices(emit: {
  (event: 'saved'): void
  (event: 'restored', saved: boolean): void
}) {
  const snapshot = ref<IServiceSelectionDto>()
  const { study, catalogue, recommendedIds, state: catalogueState } = useStudyServicePreview()
  const auth = useAuthStore()
  const owner = auth.user?.id
  const draftKey = computed(() => {
    const education = study.value
    if (!owner || auth.user?.id !== owner || !education) return
    return 'epolia:service-draft:' + JSON.stringify([owner, education.id, education.catalogOfferId])
  })
  const deviceDraft = shallowRef<ServiceSelectionDraftTypes>()
  const openDomainIds = ref<string[]>()
  const ids = ref<string[]>([])
  const state = ref<'loading' | 'ready' | 'error' | 'no-profile'>('loading')
  const saving = ref(false)
  const confirmRemoval = ref(false)
  const message = ref('')
  const success = ref(false)
  const edited = ref(false)
  let request: AbortController | undefined
  let mounted = true
  const options = computed(() =>
    serviceDomainChoices(snapshot.value, catalogue.value, recommendedIds.value),
  )
  const availableDomains = computed(() => options.value.filter((option) => !option.disabled))
  const accessibleDomainCount = computed(() => availableDomains.value.length)
  const hasAvailableDomain = computed(() => accessibleDomainCount.value > 0)
  const openDomains = computed(() => {
    if (openDomainIds.value) {
      return availableDomains.value.filter((domain) => openDomainIds.value?.includes(domain.value))
    }
    const initial =
      availableDomains.value.find((domain) => domain.recommended) ??
      (accessibleDomainCount.value === 1 ? availableDomains.value[0] : undefined)
    return initial ? [initial] : []
  })
  function isDomainOpen(id: string) {
    return openDomains.value.some((group) => group.value === id)
  }
  const allDomainsVisible = ref(false)
  const visibleDomains = computed(() =>
    allDomainsVisible.value
      ? options.value
      : options.value.filter((option, index) => index < 5 || isDomainOpen(option.value)),
  )
  const selectedGroups = computed(() =>
    availableDomains.value
      .map(({ value, label, services }) => ({
        value,
        label,
        services: services.filter((item) => ids.value.includes(item.id)),
      }))
      .filter((group) => group.services.length),
  )
  const selectedServices = computed(() => selectedGroups.value.flatMap((group) => group.services))
  const removals = computed(
    () =>
      snapshot.value?.selected.filter(
        (saved) =>
          !selectedServices.value.some(
            (item) => item.id === saved.id && item.domainId === saved.domainId,
          ),
      ) ?? [],
  )
  const dirty = computed(() => {
    const draft = deviceDraft.value
    if (!draft)
      return (
        removals.value.length > 0 ||
        selectedServices.value.length !== (snapshot.value?.selected.length ?? 0)
      )
    return (
      draft.groups.length !== selectedGroups.value.length ||
      draft.groups.some((saved) => {
        const selected = selectedGroups.value.find(
          (group) => group.value === saved.domainId,
        )?.services
        return (
          !selected ||
          selected.length !== saved.specialtyIds.length ||
          !selected.every((item) => saved.specialtyIds.includes(item.id))
        )
      })
    )
  })
  const localSaved = computed(() => !!deviceDraft.value && !dirty.value)
  const valid = computed(() => selectedGroups.value.length > 0)
  const canSaveOnAccount = computed(
    () =>
      !!snapshot.value?.revision &&
      selectedGroups.value.length === 1 &&
      selectedServices.value.every((item) =>
        snapshot.value?.eligible.some(
          (eligible) => eligible.id === item.id && eligible.domainId === item.domainId,
        ),
      ),
  )
  const canSave = computed(() => valid.value && (canSaveOnAccount.value || !!draftKey.value))
  // Both independent reads must finish before validating a stored choice against the current offer.
  let checkedDeviceDraft = false
  watch([draftKey, snapshot, catalogueState], ([key, data, catalogueStatus]) => {
    if (checkedDeviceDraft || !key || !data || catalogueStatus === 'loading') return
    checkedDeviceDraft = true
    if (edited.value) return
    try {
      const draft = readServiceDraft(key)
      if (!draft || draft.accountState !== serviceAccountState(data)) return
      const allowed = availableDomains.value.flatMap((group) => {
        const saved = draft.groups.find((item) => item.domainId === group.value)
        return group.services.filter((item) => saved?.specialtyIds.includes(item.id))
      })
      if (!allowed.length) return
      openDomainIds.value = [...new Set(allowed.map((item) => item.domainId))]
      ids.value = allowed.map((item) => item.id)
      deviceDraft.value = draft
      if (dirty.value) {
        edited.value = true
        message.value =
          'Certaines prestations de votre brouillon ne sont plus disponibles. Vérifiez vos choix.'
      }
    } catch {
      message.value = 'Le stockage de cet appareil est indisponible.'
    }
  })
  function useSnapshot(data: IServiceSelectionDto) {
    deviceDraft.value = undefined
    snapshot.value = data
    openDomainIds.value =
      data.domainId && data.eligible.some((item) => item.domainId === data.domainId)
        ? [data.domainId]
        : undefined
    emit('restored', hasSavedSelection(data))
    ids.value = data.selected
      .filter(
        (s) =>
          s.domainId === data.domainId &&
          data.eligible.some((e) => e.id === s.id && e.domainId === s.domainId),
      )
      .map((s) => s.id)
    edited.value = false
    state.value = 'ready'
  }
  async function load(keepChoices = false) {
    request?.abort()
    const controller = new AbortController()
    request = controller
    state.value = 'loading'
    const previousOpen = openDomains.value
    const previousChoices = selectedServices.value
    try {
      const data = await loadServiceSelection(controller.signal)
      if (controller.signal.aborted) return
      useSnapshot(data)
      if (keepChoices) {
        const remaining = previousChoices.filter((item) =>
          availableDomains.value.some(
            (group) =>
              group.value === item.domainId &&
              group.services.some((service) => service.id === item.id),
          ),
        )
        if (remaining.length) {
          ids.value = remaining.map((item) => item.id)
          edited.value = true
        }
        const stillOpen = previousOpen.filter((group) =>
          availableDomains.value.some((item) => item.value === group.value),
        )
        if (stillOpen.length || !previousOpen.length)
          openDomainIds.value = stillOpen.map((group) => group.value)
        for (const group of previousOpen) {
          if (!stillOpen.includes(group))
            message.value += ' Domaine devenu indisponible : ' + group.label + '.'
        }
        const lost = previousChoices.filter((item) => !remaining.includes(item))
        if (lost.length)
          message.value +=
            ' Prestations devenues indisponibles : ' +
            lost.map((item) => item.label).join(', ') +
            '.'
      }
    } catch (e) {
      if (!controller.signal.aborted)
        state.value =
          e instanceof ApiError && e.code === 'STUDENT_PROFILE_NOT_FOUND' ? 'no-profile' : 'error'
    }
  }
  function toggleDomain(id: string) {
    if (saving.value || !availableDomains.value.some((domain) => domain.value === id)) return
    const current = openDomains.value.map((group) => group.value)
    openDomainIds.value = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]
  }
  function toggle(id: string, checked: boolean) {
    if (
      saving.value ||
      !openDomains.value.some((group) => group.services.some((item) => item.id === id))
    )
      return
    edited.value = true
    ids.value = ids.value.filter((item) => item !== id)
    if (checked) ids.value.push(id)
    message.value = ''
    success.value = false
  }
  function submit() {
    if (!canSave.value || saving.value) return
    if (!canSaveOnAccount.value) {
      saveOnDevice()
      return
    }
    if (removals.value.length) confirmRemoval.value = true
    else void save()
  }
  function saveOnDevice() {
    const key = draftKey.value
    const active = selectedGroups.value[0]?.value
    if (!key || !snapshot.value || !active || !valid.value) return
    const draft = {
      accountState: serviceAccountState(snapshot.value),
      activeDomainId: active,
      groups: selectedGroups.value.map((group) => ({
        domainId: group.value,
        specialtyIds: group.services.map((item) => item.id),
      })),
    }
    try {
      localStorage.setItem(key, JSON.stringify(draft))
      deviceDraft.value = draft
      edited.value = false
      message.value = ''
    } catch {
      message.value =
        'Impossible d’enregistrer sur cet appareil. Vos choix sont conservés sur cet écran.'
    }
  }
  async function save() {
    confirmRemoval.value = false
    const revision = snapshot.value?.revision
    const group = selectedGroups.value[0]
    if (!revision || !group || !canSaveOnAccount.value || saving.value) return
    saving.value = true
    message.value = ''
    success.value = false
    try {
      const updated = await saveServiceSelection(
        revision,
        group.value,
        group.services.map((item) => item.id),
      )
      if (!mounted) return
      if (draftKey.value) {
        try {
          localStorage.removeItem(draftKey.value)
        } catch {
          // The new server revision also invalidates an obsolete device draft.
        }
      }
      useSnapshot(updated)
      success.value = true
      saving.value = false
      emit('saved')
    } catch (error) {
      if (!mounted) return
      if (
        error instanceof ApiError &&
        (error.status === 409 ||
          error.code === 'SPECIALTY_NOT_ELIGIBLE' ||
          error.code === 'SPECIALTY_DOMAIN_MISMATCH')
      ) {
        message.value =
          'Vos choix ou les prestations disponibles ont changé. Vérifiez la sélection actualisée avant de la confirmer.'
        await load(true)
      } else
        message.value =
          'L’enregistrement n’a pas pu être confirmé. Vos choix sont conservés sur cet écran. Réessayez.'
    } finally {
      saving.value = false
    }
  }
  function retry() {
    return load(!!snapshot.value)
  }
  onMounted(() => load())
  onBeforeUnmount(() => {
    mounted = false
    request?.abort()
  })
  onBeforeRouteLeave(
    () =>
      !saving.value &&
      (!edited.value ||
        !dirty.value ||
        window.confirm('Quitter sans enregistrer votre sélection ?')),
  )
  return {
    snapshot,
    options,
    hasAvailableDomain,
    accessibleDomainCount,
    openDomains,
    isDomainOpen,
    visibleDomains,
    allDomainsVisible,
    ids,
    removals,
    valid,
    canSave,
    canSaveOnAccount,
    localSaved,
    study,
    catalogueState,
    recommendedIds,
    state,
    saving,
    success,
    message,
    confirmRemoval,
    retry,
    submit,
    save,
    toggle,
    toggleDomain,
  }
}
