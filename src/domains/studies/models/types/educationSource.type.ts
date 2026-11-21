const educationSources = ['CATALOG', 'MANUAL', 'LEGACY'] as const

export type EducationSourceTypes = (typeof educationSources)[number]

export function isEducationSource(value: unknown): value is EducationSourceTypes {
  return educationSources.some((source) => source === value)
}
