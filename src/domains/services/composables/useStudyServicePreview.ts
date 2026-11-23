import { inject, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { savedStepRecordsKey } from '@/domains/onboarding/studentSteps'
import {
  getOfferCandidates,
  getServiceCatalogue,
  listEducations,
} from '@/domains/studies/api/studiesApi'
import { isCompleteCurrentEducation } from '@/domains/studies/models/education'
import type {
  IEducationDto,
  IServiceCatalogueEntryDto,
} from '@/domains/studies/models/dtos/education.dto'

export function useStudyServicePreview() {
  const savedSteps = inject(savedStepRecordsKey, undefined)
  const study = shallowRef<IEducationDto>()
  const catalogue = shallowRef<IServiceCatalogueEntryDto[]>([])
  const recommendedIds = ref<string[]>([])
  const state = ref<'loading' | 'ready' | 'error'>('loading')
  const request = new AbortController()
  const { signal } = request

  async function loadRecommendations() {
    const records = await listEducations(signal)
    if (signal.aborted) return
    const savedId = savedSteps?.value.studies
    const education = savedId
      ? records.find((row) => row.id === savedId)
      : records.find(isCompleteCurrentEducation)
    if (!education || !isCompleteCurrentEducation(education)) return
    study.value = education
    if (education.source !== 'CATALOG' || !education.catalogOfferId) return
    const rows = await getOfferCandidates(education.catalogOfferId, signal)
    if (!signal.aborted) recommendedIds.value = rows.map((row) => row.id)
  }

  let catalogueLoaded = false
  let recommendationsLoaded = false
  async function load() {
    state.value = 'loading'
    const [entries, recommendations] = await Promise.allSettled([
      catalogueLoaded ? catalogue.value : getServiceCatalogue(signal),
      recommendationsLoaded ? undefined : loadRecommendations(),
    ])
    if (signal.aborted) return
    if (entries.status === 'fulfilled') catalogue.value = entries.value
    catalogueLoaded = entries.status === 'fulfilled'
    recommendationsLoaded = recommendations.status === 'fulfilled'
    state.value = catalogueLoaded && recommendationsLoaded ? 'ready' : 'error'
  }
  onMounted(load)
  onBeforeUnmount(() => request.abort())
  return { study, catalogue, recommendedIds, state, retry: load }
}
