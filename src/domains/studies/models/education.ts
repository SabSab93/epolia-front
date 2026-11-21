export interface Campus {
  id: string
  label: string
  city: string
  address: string | null
}

export interface Offer {
  id: string
  campusId: string
  campusLabel: string
  label: string
  level: string | null
  detail: string | null
  studyFieldId: string | null
}

export interface Candidate {
  id: string
  label: string
  description: string
}

export interface Education {
  studyField?: { id: string; label: string } | null
  id: string
  title: string
  school: string | null
  level: string | null
  startDate: string | null
  endDate: string | null
  studyFieldId: string | null
  catalogOfferId: string | null
  catalogCampusId: string | null
  source: 'CATALOG' | 'MANUAL' | 'LEGACY'
}

export interface EducationInput {
  catalogOfferId?: string | null
  title?: string
  school?: string | null
  level?: string | null
  startDate?: string | null
  endDate?: string | null
}
