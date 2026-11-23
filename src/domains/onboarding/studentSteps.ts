import type { InjectionKey, Ref } from 'vue'
import { hasSavedSelection, loadServiceSelection } from '@/domains/services/api/serviceSelectionApi'
import type { LocationQuery } from 'vue-router'
import { studentServicesView, studentStudiesView } from '@/domains/onboarding/studentViews'
import { hasSavedEducation } from '@/domains/studies/api/studiesApi'

export const studentSteps = [
  {
    id: 'studies',
    title: 'Vos études',
    component: studentStudiesView,
    hasSavedData: hasSavedEducation,
  },
  {
    id: 'services',
    title: 'Que proposez-vous ?',
    component: studentServicesView,
    hasSavedData: async (signal: AbortSignal) =>
      hasSavedSelection(await loadServiceSelection(signal)),
  },
] as const

export function stepDestination(id: string) {
  return { name: 'student-' + id }
}

export function firstStudentStepDestination() {
  return stepDestination(studentSteps[0].id)
}

export function isStudentReplay(query: LocationQuery) {
  return import.meta.env.DEV && query.recommencer === '1'
}

export const savedStepRecordsKey: InjectionKey<Readonly<Ref<Record<string, string | undefined>>>> =
  Symbol('savedStepRecords')
