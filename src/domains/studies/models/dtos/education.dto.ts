import type { EducationSourceTypes } from '@/domains/studies/models/types/educationSource.type'

export interface ICampusDto {
  id: string
  label: string
  city: string
  address: string | null
}

export interface IOfferDto {
  id: string
  campusId: string
  campusLabel: string
  label: string
  level: string | null
  detail: string | null
  studyFieldId: string | null
}

export interface ICandidateDto {
  id: string
  label: string
  description: string
}

export interface IEducationDto {
  studyField?: { id: string; label: string } | null
  id: string
  title: string
  schoolAddress?: string | null
  school: string | null
  level: string | null
  startDate: string | null
  endDate: string | null
  studyFieldId: string | null
  catalogOfferId: string | null
  catalogCampusId: string | null
  source: EducationSourceTypes
}

export interface IEducationInputDto {
  catalogOfferId?: string | null
  title?: string
  schoolAddress?: string | null
  school?: string | null
  level?: string | null
  startDate?: string | null
  endDate?: string | null
}
