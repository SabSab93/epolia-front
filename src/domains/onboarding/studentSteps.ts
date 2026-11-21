import type { LocationQuery } from 'vue-router'
import { studentStudiesView } from '@/domains/onboarding/studentViews'
import { hasSavedEducation } from '@/domains/studies/api/studiesApi'

// Register a screen here when its form is integrated. Its position supplies the
// step number; links and saved data use the stable id instead.
export const studentSteps = [
  {
    id: 'studies',
    title: 'Vos études',
    component: studentStudiesView,
    hasSavedData: hasSavedEducation,
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
