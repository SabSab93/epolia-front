import { isCompleteCurrentEducation } from '@/domains/studies/models/education'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { isStudentReplay } from '@/domains/onboarding/studentSteps'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { getCampusOffers, listEducations } from '@/domains/studies/api/studiesApi'
import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'

export function useStudentStudies(
  emit: {
    (event: 'saved', recordId: string): void
    (event: 'restored', saved: boolean): void
  },
  resumeRecordId?: string,
) {
  const route = useRoute()
  const current = ref<IEducationDto>()
  const page = ref<'loading' | 'error' | 'form' | 'saved'>('loading')
  const busy = ref(false)
  const dirty = ref(false)
  const savedPanel = useTemplateRef<HTMLElement>('savedPanel')
  const offerDetail = ref('')
  let request: AbortController | undefined
  watch(
    page,
    (screen) => {
      if (screen === 'saved') savedPanel.value?.focus()
    },
    { flush: 'post' },
  )
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
  function onSaved(record: IEducationDto) {
    busy.value = false
    dirty.value = false
    current.value = record
    page.value = 'saved'
    emit('saved', record.id)
  }
  async function load() {
    request?.abort()
    const controller = new AbortController()
    request = controller
    page.value = 'loading'
    try {
      const result = await listEducations(controller.signal)
      if (controller.signal.aborted) return
      const remembered = result.find((record) => record.id === resumeRecordId)
      const resume =
        remembered ??
        (isStudentReplay(route.query)
          ? undefined
          : (result.find(isCompleteCurrentEducation) ?? result[0]))
      current.value = resume
      emit('restored', !!resume && isCompleteCurrentEducation(resume))
      page.value = 'form'
      if (resume?.source === 'LEGACY' && resume.catalogCampusId && resume.catalogOfferId) {
        const offers = await getCampusOffers(resume.catalogCampusId, controller.signal).catch(
          () => [],
        )
        if (!controller.signal.aborted)
          offerDetail.value =
            offers.find((offer) => offer.id === resume.catalogOfferId)?.detail ?? ''
      }
    } catch {
      if (!controller.signal.aborted) page.value = 'error'
    }
  }
  onMounted(load)
  onBeforeUnmount(() => request?.abort())
  return { current, page, busy, dirty, offerDetail, onSaved, load }
}
