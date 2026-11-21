import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'

export function todayForStudies() {
  return new Date().toISOString().slice(0, 10)
}

export function isCompleteCurrentEducation(education: IEducationDto) {
  const today = todayForStudies()
  return (
    !!education.school?.trim() &&
    !!education.title.trim() &&
    !!education.startDate &&
    education.startDate <= today &&
    (!education.endDate || education.endDate >= today)
  )
}
